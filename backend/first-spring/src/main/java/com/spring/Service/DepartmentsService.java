package com.spring.Service;

import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.EmptyDepartment;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Departments;
import com.spring.Models.Roles;
import com.spring.Repositories.DepartmentsRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedList;
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
    public List<Departments> getDepartments(){
        List<Departments> departments = departmentsRepository.findAll();

        if (departments.isEmpty()){
            throw new EmptyDepartment("No departments");
        }
        return departments;
    }

    //UPDATE
    public Departments updateById(int departmentId, Departments department){
        Departments initialValue = departmentsRepository.findById(departmentId).orElseThrow(() -> new NotFound("Department not found"));

        if (department.getDepartmentName().equals(initialValue.getDepartmentName())){
            throw new NoChangesDetected("No changes detected");
        }

        department.setDepartmentId(departmentId);
        return departmentsRepository.save(department);
    }

    //ARCHIVE
    public Departments archiveDepartment(int departmentId){
        Departments deptToArchive = departmentsRepository.findById(departmentId).orElseThrow(() -> new NotFound("Department not found"));
        deptToArchive.setDepartmentStatus(SoftDelete.Archived);
        deptToArchive.getRoles().forEach(roles -> roles.setRoleStatus(SoftDelete.Archived));

        return departmentsRepository.save(deptToArchive);
    }

    //RESTORE
    public Departments restoreDepartment(int departmentId){
        Departments departmentToRestore = departmentsRepository.findById(departmentId).orElseThrow(() -> new NotFound("Department not found"));
        departmentToRestore.setDepartmentStatus(SoftDelete.Active);
        departmentToRestore.getRoles().forEach(roles -> roles.setRoleStatus(SoftDelete.Active));

        return departmentsRepository.save(departmentToRestore);

    }

}
