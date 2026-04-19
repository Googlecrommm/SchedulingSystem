package com.spring.Controller;

import com.spring.Models.Machines;
import com.spring.Service.MachineService;
import com.spring.dto.MachineResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class MachineController {
    private final MachineService machineService;

    public MachineController(MachineService machineService){
        this.machineService = machineService;
    }

    //CREATE
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("createMachine")
    public ResponseEntity<SuccessResponse> createMachine(@RequestBody Machines machine){
        machineService.createMachine(machine);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Machine added"));
    }

    //READ ALL
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getMachines")
    public ResponseEntity<Page<MachineResponseDTO>> getMachines(
            @RequestParam(required = false) String machineStatus,
            @RequestParam(required = false) String modality,
            Pageable pageable){
        return ResponseEntity.ok(machineService.getMachines(machineStatus, modality, pageable));
    }

    //DROPDOWN
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("machineDropdown")
    public ResponseEntity<List<MachineResponseDTO>> machineDropdown(){
        return ResponseEntity.ok(machineService.machineDropdown());
    }

    //SEARCH MACHINE
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("searchMachine/{machineName}")
    public ResponseEntity<Page<MachineResponseDTO>> searchMachine(@PathVariable String machineName, Pageable pageable){
        return ResponseEntity.ok(machineService.searchMachine(machineName, pageable));
    }

    //UPDATE MACHINE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("updateMachine/{machineId}")
    public ResponseEntity<SuccessResponse> updateMachine(@PathVariable int machineId, @RequestBody Machines machine){
        machineService.updateMachine(machineId, machine);
        return ResponseEntity.ok().body(new SuccessResponse(200,"Machine updated"));
    }

    //MARK AS UNDER MAINTENANCE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("markAsMaintenance/{machineId}")
    public ResponseEntity<SuccessResponse> markAsMaintenance(@PathVariable int machineId){
        machineService.markAsMaintenance(machineId);
        return ResponseEntity.ok().body(new SuccessResponse(200,"Marked as Under Maintenance"));
    }

    //ARCHIVE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("archiveMachine/{machineId}")
    public ResponseEntity<SuccessResponse> archiveMachine(@PathVariable int machineId){
        machineService.archiveMachine(machineId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Machine Archived"));
    }

    //RESTORE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("activateMachine/{machineId}")
    public ResponseEntity<SuccessResponse> activateMachine(@PathVariable int machineId){
        machineService.activateMachine(machineId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Machine Activated"));
    }
}

