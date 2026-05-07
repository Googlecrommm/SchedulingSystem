package com.spring.dto;

import com.spring.Enums.PatientStatus;
import com.spring.Enums.Sex;

import java.time.LocalDate;

public class PatientResponseDTO {
    private int patientId;
    private String fullName;
    private String firstName;   // ADDED
    private String middleName;  // ADDED
    private String lastName;    // ADDED
    private String address;
    private String contactNumber;
    private LocalDate birthDate;
    private Sex sex;
    private PatientStatus patientStatus;

    public int getPatientId() { return patientId; }
    public void setPatientId(int patientId) { this.patientId = patientId; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }

    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }

    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getContactNumber() { return contactNumber; }
    public void setContactNumber(String contactNumber) { this.contactNumber = contactNumber; }

    public LocalDate getBirthDate() { return birthDate; }
    public void setBirthDate(LocalDate birthDate) { this.birthDate = birthDate; }

    public Sex getSex() { return sex; }
    public void setSex(Sex sex) { this.sex = sex; }

    public PatientStatus getPatientStatus() { return patientStatus; }
    public void setPatientStatus(PatientStatus patientStatus) { this.patientStatus = patientStatus; }
}