package com.spring.Service;

import com.spring.Enums.MachineStatus;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Machines;
import com.spring.Repositories.MachinesRepository;
import com.spring.Specifications.MachineSpecification;
import com.spring.dto.MachineResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MachineService {
    private final MachinesRepository machinesRepository;
    private final ModelMapper modelMapper;

    public MachineService(MachinesRepository machinesRepository, ModelMapper modelMapper) {
        this.machinesRepository = machinesRepository;
        this.modelMapper = modelMapper;
    }

    // ─── Reusable DTO mapping helper ────────────────────────────────────────────
    private MachineResponseDTO mapToDTO(Machines machines) {
        MachineResponseDTO machineDTO = modelMapper.map(machines, MachineResponseDTO.class);
        machineDTO.setModalityName(machines.getModality().getModalityName());
        return machineDTO;
    }

    //CREATE
    public void createMachine(Machines machine) {
        if (machinesRepository.existsByMachineName(machine.getMachineName())) {
            throw new AlreadyExists("This machine already exists");
        }
        machinesRepository.save(machine);
    }

    //READ & FILTER — departmentName null = admin sees all, non-null = scoped
    public Page<MachineResponseDTO> getMachines(String machineStatus, String modalityName, String departmentName, Pageable pageable) {
        Specification<Machines> filters = Specification
                .where(MachineSpecification.hasStatus(machineStatus))
                .and(MachineSpecification.hasModality(modalityName))
                .and(MachineSpecification.hasDepartment(departmentName)); // ADDED

        return machinesRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //DROPDOWN — admin gets all, department user gets only their department
    public List<MachineResponseDTO> machineDropdown(String departmentName) {
        if (departmentName == null) {
            // Admin — all available machines across all departments
            return machinesRepository.findAllByMachineStatus(MachineStatus.Available)
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }
        // Department user — only available machines in their department
        return machinesRepository
                .findAllByMachineStatusAndModality_Department_DepartmentNameIgnoreCase(
                        MachineStatus.Available, departmentName)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    //SEARCH — scoped by department for non-admins
    public Page<MachineResponseDTO> searchMachine(String machineName, String departmentName, Pageable pageable) {
        Specification<Machines> filters = Specification
                .where(MachineSpecification.hasDepartment(departmentName)) // ADDED
                .and((root, query, cb) ->
                        cb.like(cb.lower(root.get("machineName")),
                                "%" + machineName.toLowerCase() + "%"));

        return machinesRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //UPDATE — admin only
    public void updateMachine(int machineId, Machines machine) {
        Machines machineToUpdate = machinesRepository.findById(machineId)
                .orElseThrow(() -> new NotFound("Machine not found"));

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

    //MARK AS UNDER MAINTENANCE — admin only
    public void markAsMaintenance(int machineId) {
        Machines machineToMaintenance = machinesRepository.findById(machineId)
                .orElseThrow(() -> new NotFound("Machine not found"));

        if (machineToMaintenance.getMachineStatus().equals(MachineStatus.Under_Maintenance)) {
            throw new NoChangesDetected("Machine is already under maintenance");
        }

        machineToMaintenance.setMachineStatus(MachineStatus.Under_Maintenance);
        machinesRepository.save(machineToMaintenance);
    }

    //ARCHIVE — admin only
    public void archiveMachine(int machineId) {
        Machines machineToArchive = machinesRepository.findById(machineId)
                .orElseThrow(() -> new NotFound("Machine not found"));

        if (machineToArchive.getMachineStatus().equals(MachineStatus.Archived)) {
            throw new NoChangesDetected("Machine is already archived");
        }

        machineToArchive.setMachineStatus(MachineStatus.Archived);
        machinesRepository.save(machineToArchive);
    }

    //RESTORE — admin only
    public void activateMachine(int machineId) {
        Machines machineToActivate = machinesRepository.findById(machineId)
                .orElseThrow(() -> new NotFound("Machine not found"));

        if (machineToActivate.getMachineStatus().equals(MachineStatus.Available)) {
            throw new NoChangesDetected("Machine is already active");
        }

        machineToActivate.setMachineStatus(MachineStatus.Available);
        machinesRepository.save(machineToActivate);
    }
}