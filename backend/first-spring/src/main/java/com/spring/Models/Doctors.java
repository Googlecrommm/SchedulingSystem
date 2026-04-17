package com.spring.Models;

import com.spring.Enums.DoctorStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

@Entity
@Table(name = "doctors")
public class Doctors {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int doctorId;

    @ManyToOne
    @JoinColumn(name = "roleId", nullable = false)
    private Roles role;

    @OneToMany(mappedBy = "doctor")
    private List<Schedules> schedules;

    @Enumerated(EnumType.STRING)
    @Column(name = "availabilityStatus", nullable = false)
    private DoctorStatus availabilityStatus = DoctorStatus.Available;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    public Doctors(){}

    public int getDoctorId() {
        return doctorId;
    }

    public void setDoctorId(int doctorId) {
        this.doctorId = doctorId;
    }

    public Roles getRole() {
        return role;
    }

    public void setRole(Roles role) {
        this.role = role;
    }

    public List<Schedules> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<Schedules> schedules) {
        this.schedules = schedules;
    }

    public DoctorStatus getAvailabilityStatus() {
        return availabilityStatus;
    }

    public void setAvailabilityStatus(DoctorStatus availabilityStatus) {
        this.availabilityStatus = availabilityStatus;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
