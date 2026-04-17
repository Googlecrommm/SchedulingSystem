package com.spring.Service;

import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Departments;
import com.spring.Models.Machines;
import com.spring.Repositories.DepartmentsRepository;
import com.spring.Repositories.MachinesRepository;
import org.springframework.stereotype.Service;

@Service
public class MachineService {
    private final MachinesRepository machinesRepository;
    private final DepartmentsRepository departmentsRepository;

    public MachineService(MachinesRepository machinesRepository, DepartmentsRepository departmentsRepository){
        this.machinesRepository = machinesRepository;
        this.departmentsRepository = departmentsRepository;
    }

    //CREATE
    public void createMachine(Machines machine){
        if (machinesRepository.existsByMachineName(machine.getMachineName())){
            throw new AlreadyExists("This machine already exists");
        }

        Departments department = departmentsRepository
                .findByDepartmentName("Radiology")
                .orElseThrow(()-> new NotFound("Deparment Doesn't Exists"));

        machine.setDepartments(department);
        machinesRepository.save(machine);
    }

    //READ ALL




}
