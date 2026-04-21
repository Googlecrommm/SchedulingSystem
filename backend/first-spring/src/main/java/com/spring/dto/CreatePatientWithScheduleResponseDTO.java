package com.spring.dto;

import com.spring.Models.Patients;
import com.spring.Models.Schedules;

public class CreatePatientWithScheduleResponseDTO {
    private Patients patient;
    private Schedules schedules;

    public Patients getPatient() {
        return patient;
    }

    public void setPatient(Patients patient) {
        this.patient = patient;
    }

    public Schedules getSchedules() {
        return schedules;
    }

    public void setSchedules(Schedules schedules) {
        this.schedules = schedules;
    }
}
