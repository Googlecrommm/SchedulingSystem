package com.spring.Controller;

import java.util.List;

import com.spring.dto.DepartmentResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
    public ResponseEntity<Page<DepartmentResponseDTO>> getDepartments(@RequestParam(required = false) String departmentStatus, Pageable pageable) throws Exception {
        return ResponseEntity.ok(departmentsService.getDepartments(departmentStatus, pageable));
    }

    //DROPDOWN
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/departmentsDropdown")
    public ResponseEntity<List<DepartmentResponseDTO>> departmentsDropdown(){
        return ResponseEntity.ok(departmentsService.departmentDropdown());
    }

    //SEARCH
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/searchDepartment/{searchDept}")
    public ResponseEntity<Page<DepartmentResponseDTO>> searchDepartment(@PathVariable String searchDept,Pageable pageable){
        return ResponseEntity.ok(departmentsService.searchDepartment(searchDept, pageable));
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
    public ResponseEntity<SuccessResponse> archiveDepartment(@PathVariable int departmentId){
        departmentsService.archiveDepartment(departmentId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Deparment Archived"));
    }

    //RESTORE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/restoreDepartment/{departmentId}")
    public ResponseEntity<SuccessResponse> restoreDepartment(@PathVariable int departmentId){
        departmentsService.restoreDepartment(departmentId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Department restored"));
    }
}
