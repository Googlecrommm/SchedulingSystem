package com.spring.dto;

import com.spring.Enums.ScheduleStatus;

import java.time.LocalDateTime;

public class ScheduleResponseDTO {
    private int scheduleId;
    private String name;
    private String patientName;
    private String procedureName;
    private String machineName;
    private String roomName;
    private String hospitalizationType;
    private String hospitalizationPlan;
    private ScheduleStatus scheduleStatus;
    private String explainBy;
    private LocalDateTime startDateTime;
    private LocalDateTime endDateTime;

    public int getScheduleId() {
        return scheduleId;
    }

    public void setScheduleId(int scheduleId) {
        this.scheduleId = scheduleId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPatientName() {
        return patientName;
    }

    public void setPatientName(String patientName) {
        this.patientName = patientName;
    }

    public String getProcedureName() {
        return procedureName;
    }

    public void setProcedureName(String procedureName) {
        this.procedureName = procedureName;
    }

    public String getMachineName() {
        return machineName;
    }

    public void setMachineName(String machineName) {
        this.machineName = machineName;
    }

    public String getExplainBy() {
        return explainBy;
    }

    public void setExplainBy(String explainBy) {
        this.explainBy = explainBy;
    }

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

    public String getHospitalizationType() {
        return hospitalizationType;
    }

    public ScheduleStatus getScheduleStatus() {
        return scheduleStatus;
    }

    public void setScheduleStatus(ScheduleStatus scheduleStatus) {
        this.scheduleStatus = scheduleStatus;
    }

    public void setHospitalizationType(String hospitalizationType) {
        this.hospitalizationType = hospitalizationType;
    }

    public String getHospitalizationPlan() {
        return hospitalizationPlan;
    }

    public void setHospitalizationPlan(String hospitalizationPlan) {
        this.hospitalizationPlan = hospitalizationPlan;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }
}
