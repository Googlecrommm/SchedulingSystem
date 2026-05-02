package com.spring.Controller;

import com.spring.Models.Users;
import com.spring.Service.AuthService;
import com.spring.dto.AuthResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("register")
    public ResponseEntity<Users> register(@RequestBody Users user) throws Exception {
        return ResponseEntity.ok(authService.register(user));
    }

    @PostMapping("login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody Users user) {
        return ResponseEntity.ok(authService.login(user));
    }

    @PostMapping("logout")
    public ResponseEntity<SuccessResponse> logout(
            @RequestHeader("Authorization") String authHeader) {
        authService.logout(authHeader);
        return ResponseEntity.ok(new SuccessResponse(200, "Logged out successfully"));
    }
}
