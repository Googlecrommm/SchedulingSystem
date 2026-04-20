package com.spring.dto;

import com.spring.Enums.DoctorStatus;

public class DoctorsResponseDTO {
    private int doctorId;
    private String name;
    private DoctorStatus availabilityStatus;
    private String roleName;

    public int getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(int doctorId) {
        this.doctorId = doctorId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public DoctorStatus getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(DoctorStatus availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }
}
