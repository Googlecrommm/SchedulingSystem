package com.spring.Controller;

import com.spring.Models.Roles;
import com.spring.Service.RolesService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/Roles")
public class RolesController {

    private final RolesService rolesService;

    public RolesController(RolesService rolesService){
        this.rolesService = rolesService;
    }

    //CREATE ROLE
    @PostMapping("/CreateRole")
    public ResponseEntity<Roles> addRole(@Valid @RequestBody Roles role){
        return ResponseEntity
                .ok(rolesService.addRole(role));
    }
}
