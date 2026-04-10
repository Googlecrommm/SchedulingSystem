package com.spring.Models;


import com.spring.Enums.ScheduleStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

@Entity
@Table(name = "schedules")
public class Schedules {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scheduleId")
    private int scheduleId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patientId")
    private Patients patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "machineId")
    private Machines machine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "userId")
    private Users user;

    @Column(name = "schedule_status", nullable = false)
    @Enumerated(EnumType.STRING)
    private ScheduleStatus scheduleStatus = ScheduleStatus.Pending;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false, name = "procedureName")
    private String procedureName;

    @Column(name = "startDate", nullable = false)
    private LocalDate startDate;

    @Column(name = "endDate", nullable = false)
    private LocalDate endDate;

    public Schedules(){}

    public int getScheduleId() {
        return scheduleId;
    };

    public void setScheduleId(int scheduleId) {
        this.scheduleId = scheduleId;
    };

    public Patients getPatient() {
        return patient;
    };

    public void setPatient(Patients patient) {
        this.patient = patient;
    };

    public Users getUser() {
        return user;
    };

    public void setUser(Users user) {
        this.user = user;
    };

    public ScheduleStatus getScheduleStatus() {
        return scheduleStatus;
    };

    public void setScheduleStatus(ScheduleStatus scheduleStatus) {
        this.scheduleStatus = scheduleStatus;
    };

    public LocalDate getStartDate() {
        return startDate;
    };

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    };

    public LocalDate getEndDate() {
        return endDate;
    };

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    };

    public Machines getMachine() {
        return machine;
    };

    public void setMachine(Machines machine) {
        this.machine = machine;
    };

    public String getProcedureName(){ return procedureName; }

    public void setProcedureName(String procedureName){ this.procedureName = procedureName;}



}
