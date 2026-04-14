package com.spring.dto;

import com.spring.Enums.SoftDelete;

import javax.management.relation.RoleStatus;

public class RoleResponseDTO {
    private int roleId;
    private String roleName;
    private SoftDelete roleStatus;
    private String departmentName;

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

    public SoftDelete getRoleStatus() {
        return roleStatus;
    }

    public void setRoleStatus(SoftDelete roleStatus) {
        this.roleStatus = roleStatus;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }
}
