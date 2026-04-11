package com.spring.Controller;

import com.spring.Models.Users;
import com.spring.Service.UsersService;
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

    //CREATE
    @PostMapping("/createUser")
    public ResponseEntity<Users> addUser(@RequestBody Users user) throws Exception{
        return ResponseEntity.ok(usersService.addUser(user));
    }

    //READ
    @PreAuthorize("hasRole('FRONTDESK')")
    @GetMapping("/getUsers")
    public ResponseEntity<List<Users>> getUsers() throws Exception{
        return ResponseEntity.ok(usersService.getUsers());
    }

}
