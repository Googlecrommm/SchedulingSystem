package com.spring.Controller;

import com.spring.Models.Users;
import com.spring.Service.UsersService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/Users")
public class UserController {

    private final UsersService usersService;

    public UserController(UsersService usersService){
        this.usersService = usersService;
    }

    //CREATE
    @PostMapping("/createUser")
    public ResponseEntity<Users> addUser(@Valid @RequestBody Users user) throws Exception{
        return ResponseEntity.ok(usersService.addUser(user));
    }
}
