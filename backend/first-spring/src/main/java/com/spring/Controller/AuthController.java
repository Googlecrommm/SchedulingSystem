package com.spring.Controller;

import com.spring.Models.Users;
import com.spring.Service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService){
        this.authService = authService;
    }

    //Register
    @PostMapping("register")
    public ResponseEntity<Users> register(@RequestBody Users user) throws Exception{
        return ResponseEntity.ok(authService.register(user));
    }

    //Login
    @PostMapping("login")
    public ResponseEntity<String> login(@RequestBody Users user){
        return ResponseEntity.ok(authService.login(user));
    }
}
