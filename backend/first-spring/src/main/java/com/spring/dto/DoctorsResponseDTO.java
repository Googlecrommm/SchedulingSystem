package com.spring.dto;

import com.spring.Enums.DoctorStatus;

public class DoctorsResponseDTO {
    private int doctorId;
    private String fullName;
    private String firstName;   // ADDED
    private String middleName;  // ADDED
    private String lastName;    // ADDED
    private DoctorStatus availabilityStatus;
    private String roleName;
    private String departmentName;

    public int getDoctorId() { return doctorId; }
    public void setDoctorId(int doctorId) { this.doctorId = doctorId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public DoctorStatus getAvailabilityStatus() { return availabilityStatus; }
    public void setAvailabilityStatus(DoctorStatus availabilityStatus) { this.availabilityStatus = availabilityStatus; }

    public String getRoleName() { return roleName; }
    public void setRoleName(String roleName) { this.roleName = roleName; }

    public String getDepartmentName() { return departmentName; }
    public void setDepartmentName(String departmentName) { this.departmentName = departmentName; }
}