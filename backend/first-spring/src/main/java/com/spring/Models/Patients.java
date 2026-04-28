package com.spring.Models;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.spring.Enums.PatientStatus;
import com.spring.Enums.Sex;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "patients")
public class Patients {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int patientId;

    @NotBlank
    @Size(max = 100)
    @Column(name = "firstName", nullable = false, length = 100)
    private String firstName;

    @Size(max = 100)
    @Column(name = "middleName", nullable = true, length = 100)
    private String middleName;

    @NotBlank
    @Size(max = 100)
    @Column(name = "lastName", nullable = false, length = 100)
    private String lastName;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false, name = "address")
    private String address;

    @NotBlank
    @Size(max = 11)
    @Column(nullable = false, name = "contactNumber", length = 11)
    private String contactNumber;

    @Column(name = "birthDate", nullable = false)
    private LocalDate birthDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "patientStatus", nullable = false)
    private PatientStatus status = PatientStatus.Active;

    @Enumerated(EnumType.STRING)
    @Column(name = "sex", nullable = false)
    private Sex sex;

    public Patients(){}

    @OneToMany(mappedBy = "patient")
    private List<Schedules> schedule;

    public int getPatientId() {
        return patientId;
    }

    public void setPatientId(int patientId) {
        this.patientId = patientId;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getMiddleName() {
        return middleName;
    }

    public void setMiddleName(String middleName) {
        this.middleName = middleName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public PatientStatus getStatus() {
        return status;
    }

    public void setStatus(PatientStatus status) {
        this.status = status;
    }

    public Sex getSex() {
        return sex;
    }

    public void setSex(Sex sex) {
        this.sex = sex;
    }

    public List<Schedules> getSchedule() {
        return schedule;
    }

    public void setSchedule(List<Schedules> schedule) {
        this.schedule = schedule;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }


}
