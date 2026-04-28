package com.spring.Controller;

import com.spring.Models.Machines;
import com.spring.Security.DepartmentSecurityHelper;
import com.spring.Service.MachineService;
import com.spring.dto.MachineResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MachineController {
    private final MachineService machineService;
    private final DepartmentSecurityHelper departmentSecurityHelper;

    public MachineController(MachineService machineService, DepartmentSecurityHelper departmentSecurityHelper) {
        this.machineService = machineService;
        this.departmentSecurityHelper = departmentSecurityHelper;
    }

    //CREATE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("createMachine")
    public ResponseEntity<SuccessResponse> createMachine(@RequestBody Machines machine) {
        machineService.createMachine(machine);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Machine Added"));
    }

    //READ & FILTER — all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("getMachines")
    public ResponseEntity<Page<MachineResponseDTO>> getMachines(
            @RequestParam(required = false) String machineStatus,
            @RequestParam(required = false) String modalityName,
            @RequestParam(required = false) String departmentName,
            Pageable pageable,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(departmentName, authentication);

        return ResponseEntity.ok(
                machineService.getMachines(machineStatus, modalityName, effectiveDept, pageable));
    }

    //DROPDOWN — all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("machineDropdown")
    public ResponseEntity<List<MachineResponseDTO>> machineDropdown(Authentication authentication) {
        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(null, authentication);

        return ResponseEntity.ok(machineService.machineDropdown(effectiveDept));
    }

    //SEARCH — all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("searchMachine/{machineName}")
    public ResponseEntity<Page<MachineResponseDTO>> searchMachine(
            @PathVariable String machineName,
            Pageable pageable,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(null, authentication);

        return ResponseEntity.ok(
                machineService.searchMachine(machineName, effectiveDept, pageable));
    }

    //UPDATE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("updateMachine/{machineId}")
    public ResponseEntity<SuccessResponse> updateMachine(
            @PathVariable int machineId,
            @RequestBody Machines machine) {
        machineService.updateMachine(machineId, machine);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Machine Updated"));
    }

    //MARK AS UNDER MAINTENANCE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("markAsMaintenance/{machineId}")
    public ResponseEntity<SuccessResponse> markAsMaintenance(@PathVariable int machineId) {
        machineService.markAsMaintenance(machineId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Marked as Under Maintenance"));
    }

    //ARCHIVE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("archiveMachine/{machineId}")
    public ResponseEntity<SuccessResponse> archiveMachine(@PathVariable int machineId) {
        machineService.archiveMachine(machineId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Machine Archived"));
    }

    //RESTORE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("activateMachine/{machineId}")
    public ResponseEntity<SuccessResponse> activateMachine(@PathVariable int machineId) {
        machineService.activateMachine(machineId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Machine Activated"));
    }
}