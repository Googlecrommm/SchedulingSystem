package com.spring.Service;

import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.*;
import com.spring.Models.Departments;
import com.spring.Repositories.DepartmentsRepository;
import com.spring.Specifications.DepartmentSpecification;
import com.spring.dto.DepartmentResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class DepartmentsService {

    private final DepartmentsRepository departmentsRepository;
    private final ModelMapper modelMapper;

    public DepartmentsService(DepartmentsRepository departmentsRepository, ModelMapper modelMapper){
        this.departmentsRepository = departmentsRepository;
        this.modelMapper = modelMapper;
    }

    //CREATE
    public Departments addDepartment(Departments department) throws Exception {
        if(departmentsRepository.existsByDepartmentName(department.getDepartmentName())){
            throw new Exception("Department already exists");
        }else {
            return departmentsRepository.save(department);
        }

    }

    //READ & FILTER
    public Page<DepartmentResponseDTO> getDepartments(String departmentStatus, Pageable pageable){
        Specification<Departments> filters = Specification
                .where(DepartmentSpecification.hasStatus(departmentStatus))
                .and(DepartmentSpecification.excludeDept());


        return departmentsRepository
                .findAll(filters, pageable)
                .map(departments -> {
                    return modelMapper.map(departments, DepartmentResponseDTO.class);
                });

    }

    //SEARCH DEPARTMENT BY NAME
    public Page<DepartmentResponseDTO> searchDepartment(String searchDept, Pageable pageable){
        return departmentsRepository
                .searchByDepartmentName(searchDept, pageable)
                .map(departments -> {
                    return modelMapper.map(departments, DepartmentResponseDTO.class);
                });
    }

    //DROPDOWN
    public List<DepartmentResponseDTO> departmentDropdown(){
        return departmentsRepository
                .findAllByDepartmentStatusNotAndDepartmentNameNot(SoftDelete.Archived, "ICTD")
                .stream()
                .map(departments -> {
                    return modelMapper.map(departments, DepartmentResponseDTO.class);
                })
                .toList();
    }

    //UPDATE
    public Departments updateById(int departmentId, Departments department){
        Departments initialValue = departmentsRepository.findById(departmentId).orElseThrow(() -> new NotFound("Department not found"));

        if (department.getDepartmentName() == null){
            throw new NotFound("No new data found");
        }

        if (initialValue.getDepartmentName().equalsIgnoreCase("ICTD")){
            throw new NotAllowed("Edit not allowed");
        }

        if (department.getDepartmentName().equalsIgnoreCase("ICTD")){
            throw new NotAllowed("Department can't be set to ICTD");
        }

        if (departmentsRepository.existsByDepartmentName(department.getDepartmentName())){
            throw new AlreadyExists("Department already exists");
        }

        if (department.getDepartmentName().equals(initialValue.getDepartmentName())){
            throw new NoChangesDetected("No changes detected");
        }



        department.setDepartmentId(departmentId);
        return departmentsRepository.save(department);
    }

    //ARCHIVE
    public void archiveDepartment(int departmentId){
        Departments deptToArchive = departmentsRepository.findById(departmentId).orElseThrow(() -> new NotFound("Department not found"));

        if (deptToArchive.getDepartmentStatus().equals(SoftDelete.Archived)){
            throw new NoChangesDetected("Department is already Archived");
        }

        if (deptToArchive.getDepartmentName().equalsIgnoreCase("Information Communication Technology") || deptToArchive.getDepartmentName().equalsIgnoreCase("ICTD")){
            throw new NotAllowed("ICTD can't be archived");
        }

        deptToArchive.setDepartmentStatus(SoftDelete.Archived);
        deptToArchive.getRoles().forEach(roles -> roles.setRoleStatus(SoftDelete.Archived));

        departmentsRepository.save(deptToArchive);
    }

    //RESTORE
    public void restoreDepartment(int departmentId){
        Departments departmentToRestore = departmentsRepository.findById(departmentId).orElseThrow(() -> new NotFound("Department not found"));

        if (departmentToRestore.getDepartmentStatus().equals(SoftDelete.Active)){
            throw new NoChangesDetected("Department is already Active");
        }

        departmentToRestore.setDepartmentStatus(SoftDelete.Active);
        departmentToRestore.getRoles().forEach(roles -> roles.setRoleStatus(SoftDelete.Active));

        departmentsRepository.save(departmentToRestore);

    }

}
