package com.spring.Service;

import com.spring.Enums.MachineStatus;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotAllowed;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Machines;
import com.spring.Models.Modalities;
import com.spring.Models.Users;
import com.spring.Repositories.MachinesRepository;
import com.spring.Repositories.ModalitiesRepository;
import com.spring.Specifications.MachineSpecification;
import com.spring.dto.MachineResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MachineService {
    private final MachinesRepository machinesRepository;
    private final ModelMapper modelMapper;
    private final ModalitiesRepository modalitiesRepository;

    public MachineService(MachinesRepository machinesRepository, ModelMapper modelMapper,
                          ModalitiesRepository modalitiesRepository) {
        this.machinesRepository = machinesRepository;
        this.modelMapper = modelMapper;
        this.modalitiesRepository = modalitiesRepository;
    }

    // ─── Admin bypasses department check; frontdesk is scoped to their department ─
    private void validateMachineBelongsToDepartment(Machines machine, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;

        Users user = (Users) authentication.getPrincipal();

        if (user.getRole() == null || user.getRole().getDepartment() == null) {
            throw new NotAllowed("You are not assigned to any department.");
        }

        String userDept = user.getRole().getDepartment().getDepartmentName();
        String machineDept = machine.getModality().getDepartment().getDepartmentName();

        if (!userDept.equalsIgnoreCase(machineDept)) {
            throw new NotAllowed(
                    "You can only manage machines within your department (" + userDept + ")."
            );
        }
    }

    // ─── Reusable DTO mapping helper ────────────────────────────────────────────
    private MachineResponseDTO mapToDTO(Machines machines) {
        MachineResponseDTO machineDTO = modelMapper.map(machines, MachineResponseDTO.class);
        machineDTO.setModalityName(machines.getModality().getModalityName());
        return machineDTO;
    }

    //CREATE — admin and frontdesk, frontdesk scoped to their department
    public void createMachine(Machines machine, Authentication authentication) {
        if (machinesRepository.existsByMachineName(machine.getMachineName())) {
            throw new AlreadyExists("This machine already exists");
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin) {
            Users user = (Users) authentication.getPrincipal();

            if (user.getRole() == null || user.getRole().getDepartment() == null) {
                throw new NotAllowed("You are not assigned to any department.");
            }

            // Re-fetch modality to get its department
            Modalities modality = modalitiesRepository.findById(machine.getModality().getModalityId())
                    .orElseThrow(() -> new RuntimeException("Modality not found"));

            String userDept = user.getRole().getDepartment().getDepartmentName();
            String modalityDept = modality.getDepartment().getDepartmentName();

            if (!userDept.equalsIgnoreCase(modalityDept)) {
                throw new NotAllowed(
                        "You can only add machines under your department (" + userDept + ")."
                );
            }
        }

        machinesRepository.save(machine);
    }

    //READ & FILTER
    public Page<MachineResponseDTO> getMachines(MachineStatus machineStatus, String modalityName, String departmentName, Pageable pageable) {
        Specification<Machines> filters = Specification
                .where(MachineSpecification.hasStatus(machineStatus))
                .and(MachineSpecification.hasModality(modalityName))
                .and(MachineSpecification.hasDepartment(departmentName));

        return machinesRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //DROPDOWN
    public List<MachineResponseDTO> machineDropdown(String departmentName) {
        if (departmentName == null) {
            return machinesRepository.findAllByMachineStatus(MachineStatus.Available)
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }
        return machinesRepository
                .findAllByMachineStatusAndModality_Department_DepartmentNameIgnoreCase(
                        MachineStatus.Available, departmentName)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    //SEARCH
    public Page<MachineResponseDTO> searchMachine(String machineName, String departmentName, Pageable pageable) {
        Specification<Machines> filters = Specification
                .where(MachineSpecification.hasDepartment(departmentName))
                .and((root, query, cb) ->
                        cb.like(cb.lower(root.get("machineName")),
                                "%" + machineName.toLowerCase() + "%"));

        return machinesRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //UPDATE — admin and frontdesk, frontdesk scoped to their department
    public void updateMachine(int machineId, Machines machine, Authentication authentication) {
        Machines machineToUpdate = machinesRepository.findById(machineId)
                .orElseThrow(() -> new NotFound("Machine not found"));

        validateMachineBelongsToDepartment(machineToUpdate, authentication);

        if (machinesRepository.existsByMachineName(machine.getMachineName())) {
            throw new AlreadyExists("Machine already exists");
        }

        if (machine.getMachineName() != null && !machine.getMachineName().isEmpty()) {
            machineToUpdate.setMachineName(machine.getMachineName());
        }

        if (machine.getModality() != null) {
            machineToUpdate.setModality(machine.getModality());
        }

        machineToUpdate.setMachineStatus(machineToUpdate.getMachineStatus());
        machinesRepository.save(machineToUpdate);
    }

    //MARK AS UNDER MAINTENANCE — admin and frontdesk, frontdesk scoped to their department
    public void markAsMaintenance(int machineId, Authentication authentication) {
        Machines machineToMaintenance = machinesRepository.findById(machineId)
                .orElseThrow(() -> new NotFound("Machine not found"));

        validateMachineBelongsToDepartment(machineToMaintenance, authentication);

        if (machineToMaintenance.getMachineStatus().equals(MachineStatus.Under_Maintenance)) {
            throw new NoChangesDetected("Machine is already under maintenance");
        }

        machineToMaintenance.setMachineStatus(MachineStatus.Under_Maintenance);
        machinesRepository.save(machineToMaintenance);
    }

    //ARCHIVE — admin and frontdesk, frontdesk scoped to their department
    public void archiveMachine(int machineId, Authentication authentication) {
        Machines machineToArchive = machinesRepository.findById(machineId)
                .orElseThrow(() -> new NotFound("Machine not found"));

        validateMachineBelongsToDepartment(machineToArchive, authentication);

        if (machineToArchive.getMachineStatus().equals(MachineStatus.Archived)) {
            throw new NoChangesDetected("Machine is already archived");
        }

        machineToArchive.setMachineStatus(MachineStatus.Archived);
        machinesRepository.save(machineToArchive);
    }

    //RESTORE — admin and frontdesk, frontdesk scoped to their department
    public void activateMachine(int machineId, Authentication authentication) {
        Machines machineToActivate = machinesRepository.findById(machineId)
                .orElseThrow(() -> new NotFound("Machine not found"));

        validateMachineBelongsToDepartment(machineToActivate, authentication);

        if (machineToActivate.getMachineStatus().equals(MachineStatus.Available)) {
            throw new NoChangesDetected("Machine is already active");
        }

        machineToActivate.setMachineStatus(MachineStatus.Available);
        machinesRepository.save(machineToActivate);
    }
}