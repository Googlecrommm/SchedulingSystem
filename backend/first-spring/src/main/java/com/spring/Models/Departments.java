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

    @OneToMany(mappedBy = "departments")
    private List<Machines> machines;

    @OneToMany(mappedBy = "department")
    private List<Roles> roles;

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

    public List<Machines> getMachines() {
        return machines;
    }

    public void setMachines(List<Machines> machines) {
        this.machines = machines;
    }

    public List<Roles> getRoles() {
        return roles;
    }

    public void setRoles(List<Roles> roles) {
        this.roles = roles;
    }


}
