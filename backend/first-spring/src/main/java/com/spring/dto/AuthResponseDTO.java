package com.spring.dto;

public class AuthResponseDTO {
    private String name;
    private String role;
    private String token;

    public AuthResponseDTO(String token, String name, String role){
        this.name = name;
        this.role = role;
        this.token = token;
    }

    public String getName() {
        return name;
    }

    public String getRole() {
        return role;
    }

    public String getToken() {
        return token;
    }
}
