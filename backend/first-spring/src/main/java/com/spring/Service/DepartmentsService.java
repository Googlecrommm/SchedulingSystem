package com.spring.Service;

import com.spring.Models.Departments;
import com.spring.Repositories.DepartmentsRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DepartmentsService {

    private final DepartmentsRepository departmentsRepository;

    public DepartmentsService(DepartmentsRepository departmentsRepository){
        this.departmentsRepository = departmentsRepository;
    }

    //CREATE
    public Departments addDepartment(Departments department) throws Exception {
        if(departmentsRepository.existsByDepartmentName(department.getDepartmentName())){
            throw new Exception("Department already exists");
        }else {
            return departmentsRepository.save(department);
        }

    }

    //READ
    public List<Departments> getDepartments() throws Exception{
        List<Departments> departments = departmentsRepository.findAll();

        if (departments.isEmpty()){
            throw new Exception("No Departments Yet");
        }
        return departments;
    }

    //UPDATE
    public Departments updateById(int departmentId, Departments department){

        department.setDepartmentId(departmentId);

        return departmentsRepository.save(department);
    }

}
