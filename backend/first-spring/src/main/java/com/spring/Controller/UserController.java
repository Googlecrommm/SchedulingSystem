package com.spring.Controller;

import com.spring.Models.Users;
import com.spring.Service.UsersService;
import com.spring.dto.SuccessResponse;
import com.spring.dto.UserResponseDTO;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class UserController {

    private final UsersService usersService;

    public UserController(UsersService usersService){
        this.usersService = usersService;
    }

    //READ
    @GetMapping("getUsers")
    public ResponseEntity<List<UserResponseDTO>> getUsers() throws Exception{
        return ResponseEntity.ok(usersService.getUsers());
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

}
