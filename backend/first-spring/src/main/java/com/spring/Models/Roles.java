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
@Table(name = "roles")
public class Roles {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "roleId")
    private int roleId;

    @ManyToOne
    @JoinColumn(name = "departmentId", nullable = false)
    private Departments department;

    @NotBlank
    @Size(max = 100)
    @Column(name = "roleName", nullable = false, length = 100)
    private String roleName;

    @Column(name = "roleStatus", nullable = false)
    @Enumerated(EnumType.STRING)
    private SoftDelete softDelete = SoftDelete.Active;

    public Roles(){}

    @OneToMany(mappedBy = "role")
    private List<Users> users;

    @OneToMany(mappedBy = "role")
    private List<Doctors> doctors;

    public List<Users> getUsers() {
        return users;
    }

    public void setUsers(List<Users> users) {
        this.users = users;
    }

    public int getRoleId() {
        return roleId;
    }

    public void setRoleId(int roleId) {
        this.roleId = roleId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public Departments getDepartment() {
        return department;
    }

    public void setDepartment(Departments department) {
        this.department = department;
    }

    public SoftDelete getRoleStatus(){
        return softDelete;
    }

    public void setRoleStatus(SoftDelete softDelete){
        this.softDelete = softDelete;
    }

    public SoftDelete getSoftDelete() {
        return softDelete;
    }

    public void setSoftDelete(SoftDelete softDelete) {
        this.softDelete = softDelete;
    }

    public List<Doctors> getDoctors() {
        return doctors;
    }

    public void setDoctors(List<Doctors> doctors) {
        this.doctors = doctors;
    }
}
