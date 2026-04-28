package com.spring.dto;

import com.spring.Enums.DoctorStatus;

public class DoctorsResponseDTO {
    private int doctorId;
    private String fullName;
    private DoctorStatus availabilityStatus;
    private String roleName;

    public int getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(int doctorId) {
        this.doctorId = doctorId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
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
