package com.spring.Controller;

import com.spring.Models.Machines;
import com.spring.Service.MachineService;
import com.spring.dto.SuccessResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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

}
