package com.spring.Controller;

import com.spring.Exceptions.AlreadyExists;
import com.spring.Models.Roles;
import com.spring.Service.RolesService;
import com.spring.dto.RoleResponseDTO;
import com.spring.dto.SuccessResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RolesController {

    private final RolesService rolesService;

    public RolesController(RolesService rolesService){
        this.rolesService = rolesService;
    }

    //CREATE ROLE
//    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("/createRole")
    public ResponseEntity<Void> addRole(@Valid @RequestBody Roles role) throws AlreadyExists {
        rolesService.addRole(role);
        return ResponseEntity
                .noContent().build();
    }

    //READ ALL
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/getRoles")
    public ResponseEntity<List<RoleResponseDTO>> getRoles(){
        return ResponseEntity
                .ok(rolesService.getRoles());
    }

    //UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/updateRole/{roleId}")
    public ResponseEntity<SuccessResponse> updateRole(@PathVariable int roleId, @RequestBody Roles role){
        rolesService.updateRole(roleId, role);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Update Success"));
    }

    //ARCHIVE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/archiveRole/{roleId}")
    public ResponseEntity<SuccessResponse> archiveRole(@PathVariable int roleId){
        rolesService.archiveRole(roleId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Role Archived"));
    }

    //RESTORE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/restoreRole/{roleId}")
    public ResponseEntity<SuccessResponse> restoreRole(@PathVariable int roleId){
        rolesService.restoreRole(roleId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Role Restored"));
    }

}
