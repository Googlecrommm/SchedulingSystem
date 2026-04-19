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

    public MachineService(MachinesRepository machinesRepository, ModelMapper modelMapper){
        this.machinesRepository = machinesRepository;
        this.modelMapper = modelMapper;
    }

    //CREATE
    public void createMachine(Machines machine){
        if (machinesRepository.existsByMachineName(machine.getMachineName())){
            throw new AlreadyExists("This machine already exists");
        }

        machinesRepository.save(machine);
    }

    //READ ALL
    public Page<MachineResponseDTO> getMachines(String machineStatus, String modalityName, Pageable pageable){

        Specification<Machines> filters = Specification
                .where(MachineSpecification.hasStatus(machineStatus))
                .and(MachineSpecification.hasModality(modalityName));

        return machinesRepository.findAll(filters, pageable)
                .map(machines -> {
                    MachineResponseDTO machineDTO = modelMapper.map(machines, MachineResponseDTO.class);
                    machineDTO.setModalityName(machines.getModality().getModalityName());
                    return machineDTO;
                });
    }

    // MACHINE DROPDOWN
    public List<MachineResponseDTO> machineDropdown(){
        return machinesRepository.findAllByMachineStatus(MachineStatus.Available)
                .stream()
                .map(machines -> {
                    MachineResponseDTO machineDTO = modelMapper.map(machines, MachineResponseDTO.class);
                    machineDTO.setModalityName(machines.getModality().getModalityName());
                    return machineDTO;
                })
                .toList();

    }

    //SEARCH MACHINE NAME
    public Page<MachineResponseDTO> searchMachine(String machineName, Pageable pageable){
        return machinesRepository.searchByMachineNameContaining(machineName, pageable)
                .map(machines -> {
                    MachineResponseDTO machineDTO = modelMapper.map(machines, MachineResponseDTO.class);
                    machineDTO.setModalityName(machines.getModality().getModalityName());
                    return machineDTO;
                });
    }

    //UPDATE
    public void updateMachine(int machineId, Machines machine){
        Machines machineToUpdate = machinesRepository.findById(machineId).orElseThrow(() -> new NotFound("Machine not found"));

        if (machine.getMachineName() != null && !machine.getMachineName().isEmpty()){
            machineToUpdate.setMachineName(machine.getMachineName());
        }

        if (machine.getModality() != null){
            machineToUpdate.setModality(machine.getModality());
        }

        machineToUpdate.setMachineStatus(machineToUpdate.getMachineStatus());
        machinesRepository.save(machineToUpdate);
    }

    //MARK AS UNDER MAINTENANCE
    public void markAsMaintenance(int machineId){
        Machines machineToMaintenance = machinesRepository.findById(machineId).orElseThrow(() -> new NotFound("Machine not found"));

        if (machineToMaintenance.getMachineStatus().equals(MachineStatus.Under_Maintenance)){
            throw new NoChangesDetected("Machine is already under maintenance");
        }

        machineToMaintenance.setMachineStatus(MachineStatus.Under_Maintenance);
        machinesRepository.save(machineToMaintenance);
    }

    //ARCHIVE
    public void archiveMachine(int machineId){
        Machines machineToArchive = machinesRepository.findById(machineId).orElseThrow(() -> new NotFound("Machine not found"));

        if (machineToArchive.getMachineStatus().equals(MachineStatus.Archived)){
            throw new NoChangesDetected("Machine is already archived");
        }

        machineToArchive.setMachineStatus(MachineStatus.Archived);
        machinesRepository.save(machineToArchive);
    }

    //RESTORE
    public void activateMachine(int machineId){
        Machines machineToActivate = machinesRepository.findById(machineId).orElseThrow(() -> new NotFound("Machine not found"));

        if(machineToActivate.getMachineStatus().equals(MachineStatus.Available)){
            throw new NoChangesDetected("Machine is already active");
        }

        machineToActivate.setMachineStatus(MachineStatus.Available);
        machinesRepository.save(machineToActivate);
    }



}
