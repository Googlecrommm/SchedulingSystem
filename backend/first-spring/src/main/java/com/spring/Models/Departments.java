package com.spring.Models;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

@Entity
@Table(name = "departments")
public class Departments {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "departmentId")
    private int departmentId;

    @NotBlank
    @Size(max = 100)
    @Column(name = "departmentName", length = 100, nullable = false)
    private String departmentName;

    public Departments(){}

    @OneToMany(mappedBy = "department")
    private List<Users> users;

    public List<Users> getUsers(){
        return users;
    }

    public void setUsers(List<Users> user){
        this.users = user;
    }

    public int getDepartmentId() {
        return departmentId;
    }

    public void setDepartmentId(int departmentId) {
        this.departmentId = departmentId;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }


}
