package com.spring.Models;

import com.spring.Enums.MachineStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

@Entity
@Table(name = "machines")
public class Machines {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int machineId;

    @OneToMany(mappedBy = "machine")
    private List<Schedules> schedules;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "modalityId", nullable = false)
    private Modalities modality;

    @NotBlank
    @Size(max = 100)
    @Column(nullable = false, name = "machineName")
    private String machineName;

    @Column(name = "machineStatus")
    @Enumerated(EnumType.STRING)
    private MachineStatus machineStatus = MachineStatus.Available;

    public Machines(){}

    public int getMachineId() {
        return machineId;
    }

    public void setMachineId(int machineId) {
        this.machineId = machineId;
    }

    public List<Schedules> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<Schedules> schedules) {
        this.schedules = schedules;
    }

    public String getMachineName() {
        return machineName;
    }

    public void setMachineName(String machineName) {
        this.machineName = machineName;
    }

    public MachineStatus getMachineStatus() {
        return machineStatus;
    }

    public void setMachineStatus(MachineStatus machineStatus) {
        this.machineStatus = machineStatus;
    }

    public Modalities getModality() {
        return modality;
    }

    public void setModality(Modalities modality) {
        this.modality = modality;
    }
}
