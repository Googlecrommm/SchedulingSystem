package com.spring.Service;

import com.spring.Exceptions.AlreadyExists;
import com.spring.Models.Machines;
import com.spring.Repositories.MachinesRepository;
import com.spring.Specifications.MachineSpecification;
import com.spring.dto.MachineResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

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
    public Page<MachineResponseDTO> getMachines(String machineStatus, Pageable pageable){

        Specification<Machines> filters = Specification
                .where(MachineSpecification.hasStatus(machineStatus));

        return machinesRepository.findAll(filters, pageable)
                .map(machines -> {
                    MachineResponseDTO machineDTO = modelMapper.map(machines, MachineResponseDTO.class);
                    machineDTO.setModality(machines.getModality().getModality());
                    return machineDTO;
                });
    }



}
