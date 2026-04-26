package com.spring.dto;

import com.spring.Enums.ScheduleStatus;
import com.spring.Enums.Sex;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class ScheduleResponseDTO {
    private int scheduleId;
    private String name;
    private String patientName;
    private String contactNumber;
    private LocalDate birthDate;
    private String address;
    private Sex sex;
    private String departmentName;
    private String procedureName;
    private String machineName;
    private String roomName;
    private String hospitalizationType;
    private String hospitalizationPlan;
    private String remarks;
    private ScheduleStatus scheduleStatus;
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

    public String getContactNumber() {
        return contactNumber;
    }

    public void setContactNumber(String contactNumber) {
        this.contactNumber = contactNumber;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public void setBirthDate(LocalDate birthDate) {
        this.birthDate = birthDate;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Sex getSex() {
        return sex;
    }

    public void setSex(Sex sex) {
        this.sex = sex;
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

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }
}
