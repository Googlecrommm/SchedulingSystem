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
    public ResponseEntity<Page<MachineResponseDTO>> getMachines(@RequestParam(required = false) String machineStatus, Pageable pageable){
        return ResponseEntity.ok(machineService.getMachines(machineStatus, pageable));
    }

}
