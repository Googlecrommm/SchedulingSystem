package com.spring.Models;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.spring.Enums.SoftDelete;
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

    @JsonIgnore
    @OneToMany(mappedBy = "department")
    private List<Roles> roles;

    @Column(name = "departmentStatus", nullable = false)
    @Enumerated(EnumType.STRING)
    private SoftDelete softDelete = SoftDelete.Active;

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

    public SoftDelete getDepartmentStatus(){
        return softDelete;
    }

    public void setDepartmentStatus(SoftDelete softDelete){
        this.softDelete = softDelete;
    }


}
