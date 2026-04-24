package com.spring.Models;


import com.spring.Enums.ScheduleStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "schedules")
public class Schedules {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "scheduleId")
    private int scheduleId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patientId", nullable = false)
    private Patients patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "machineId")
    private Machines machine;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "doctorId", nullable = false)
    private Doctors doctor;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "planId", nullable = false)
    private HospitalizationPlan hospitalizationPlan;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "typeId", nullable = false)
    private HospitalizationType hospitalizationType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "roomId")
    private Rooms room;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, name = "procedureName", length = 100)
    private String procedureName;

    @NotBlank
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "scheduleStatus", nullable = false)
    @Enumerated(EnumType.STRING)
    private ScheduleStatus scheduleStatus = ScheduleStatus.Scheduled;

    @NotBlank
    @Size(max = 100)
    @Column(name = "explainBy", nullable = false, length = 100)
    private String explainBy;

    @Column(name = "startDate", nullable = false)
    private LocalDateTime startDateTime;

    @Column(name = "endDate", nullable = false)
    private LocalDateTime endDateTime;

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

    public Doctors getDoctor() {
        return doctor;
    }

    public void setDoctor(Doctors doctor) {
        this.doctor = doctor;
    }

    public Rooms getRoom() {
        return room;
    }

    public void setRoom(Rooms room) {
        this.room = room;
    }

    public ScheduleStatus getScheduleStatus() {
        return scheduleStatus;
    };

    public void setScheduleStatus(ScheduleStatus scheduleStatus) {
        this.scheduleStatus = scheduleStatus;
    };

    public LocalDateTime getStartDateTime() {
        return startDateTime;
    }

    public void setStartDateTime(LocalDateTime startDateTime) {
        this.startDateTime = startDateTime;
    }

    public LocalDateTime getEndDateTime() {
        return endDateTime;
    }

    public void setEndDateTime(LocalDateTime endDateTime) {
        this.endDateTime = endDateTime;
    }

    public Machines getMachine() {
        return machine;
    };

    public void setMachine(Machines machine) {
        this.machine = machine;
    };

    public String getProcedureName(){ return procedureName; }

    public void setProcedureName(String procedureName){ this.procedureName = procedureName;}

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getExplainBy() {
        return explainBy;
    }

    public void setExplainBy(String explainBy) {
        this.explainBy = explainBy;
    }

    public HospitalizationPlan getHospitalizationPlan() {
        return hospitalizationPlan;
    }

    public void setHospitalizationPlan(HospitalizationPlan hospitalizationPlan) {
        this.hospitalizationPlan = hospitalizationPlan;
    }

    public HospitalizationType getHospitalizationType() {
        return hospitalizationType;
    }

    public void setHospitalizationType(HospitalizationType hospitalizationType) {
        this.hospitalizationType = hospitalizationType;
    }
}
