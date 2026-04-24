package com.spring.dto;

public class AuthResponseDTO {
    private String name;
    private String role;
    private String token;
    private String departmentName;

    public AuthResponseDTO(String token, String name, String role, String departmentName){
        this.name = name;
        this.role = role;
        this.token = token;
        this.departmentName = departmentName;
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

    public String getDepartmentName() {
        return departmentName;
    }
}
