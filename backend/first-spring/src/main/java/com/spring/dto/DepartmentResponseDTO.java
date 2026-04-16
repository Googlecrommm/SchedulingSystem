package com.spring.dto;

import com.spring.Enums.SoftDelete;

public class DepartmentResponseDTO {
    private int departmentId;
    private String departmentName;
    private SoftDelete departmentStatus;

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

    public SoftDelete getDepartmentStatus() {
        return departmentStatus;
    }

    public void setDepartmentStatus(SoftDelete departmentStatus) {
        this.departmentStatus = departmentStatus;
    }
}
