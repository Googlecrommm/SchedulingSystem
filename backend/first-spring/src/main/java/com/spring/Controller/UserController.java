package com.spring.Controller;

import com.spring.Models.Users;
import com.spring.Service.UsersService;
import com.spring.dto.SuccessResponse;
import com.spring.dto.UserResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api")
public class UserController {

    private final UsersService usersService;

    public UserController(UsersService usersService){
        this.usersService = usersService;
    }

    //READ
    @GetMapping("getUsers")
    public ResponseEntity<Page<UserResponseDTO>> getUsers(
            @RequestParam(required = false) String accountStatus,
            @RequestParam(required = false) String departmentName,
            @RequestParam(required = false) String roleName,
            Pageable pageable
    ){
        return ResponseEntity.ok(usersService.getUsers(accountStatus, departmentName, roleName, pageable));
    }

    //SEARCH BY NAME
    @GetMapping("searchUser/{searchName}")
    public ResponseEntity<Page<UserResponseDTO>> searchUser(
            @PathVariable String searchName,
            Pageable pageable
    ){
        return ResponseEntity
                .ok(usersService.searchUser(searchName, pageable));
    }

    //READ BY ID
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getById/{userId}")
    public ResponseEntity<UserResponseDTO> getUserById(@PathVariable int userId){
        return ResponseEntity.ok(usersService.getUserById(userId));
    }

    //UPDATE USER
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("updateUser/{userId}")
    public ResponseEntity<SuccessResponse> updateUser(@PathVariable int userId, @RequestBody Users user){
        usersService.updateUser(userId, user);
        return ResponseEntity.ok(new SuccessResponse(200, "Update Success"));
    }

    //DISABLE USER
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("disableUser/{userId}")
    public ResponseEntity<SuccessResponse> disableUser(@PathVariable int userId){
        usersService.disableAccount(userId);
        return ResponseEntity.ok(new SuccessResponse(200, "Account Disabled"));
    }

    //ACTIVATE USER
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("activateUser/{userId}")
    public ResponseEntity<SuccessResponse> activateUser(@PathVariable int userId){
        usersService.activateAccount(userId);
        return ResponseEntity.ok(new SuccessResponse(200, "Account Activated"));
    }


}
