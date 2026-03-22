package com.spring.Controller;

import com.spring.Enums.Role;
import com.spring.Models.Users;
import com.spring.Service.UserService;
import org.apache.catalina.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/GetUsers")
public class UsersController {
    private final UserService userService;

    public UsersController(UserService userService){
        this.userService = userService;
    }

    @GetMapping
    public List<Users> getUsers(){
        return userService.getUsers();
    }

}
