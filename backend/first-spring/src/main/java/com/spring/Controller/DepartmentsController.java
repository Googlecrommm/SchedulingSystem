package com.spring.Controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spring.Models.Departments;
import com.spring.Service.DepartmentsService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class DepartmentsController {
    private final DepartmentsService departmentsService;

    public DepartmentsController(DepartmentsService departmentsService){
        this.departmentsService = departmentsService;
    }

    //CREATE
    @PostMapping("/createDepartment")
    public ResponseEntity<Departments> addDepartment(@Valid @RequestBody Departments department) throws Exception {
        return ResponseEntity.ok(departmentsService.addDepartment(department));
    }

    //READ
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/getDepartments")
    public ResponseEntity<List<Departments>> getDepartments() throws Exception {
        return ResponseEntity.ok(departmentsService.getDepartments());
    }

    //UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/updateDepartment/{departmentId}")
    public ResponseEntity<Departments> updateDepartment(@PathVariable int departmentId, @RequestBody Departments department){
        return ResponseEntity.ok(departmentsService.updateById(departmentId, department));
    }

    //ARCHIVE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/archiveDepartment/{departmentId}")
    public ResponseEntity<Departments> archiveDepartment(@PathVariable int departmentId){
        return ResponseEntity.ok(departmentsService.archiveDepartment(departmentId));
    }

    //RESTORE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/restoreDepartment/{departmentId}")
    public ResponseEntity<Departments> restoreDepartment(@PathVariable int departmentId){
        return ResponseEntity.ok(departmentsService.restoreDepartment(departmentId));
    }
}
