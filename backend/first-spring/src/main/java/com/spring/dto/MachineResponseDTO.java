package com.spring.dto;

import com.spring.Enums.MachineStatus;

public class MachineResponseDTO {
    private int machineId;
    private String machineName;
    private MachineStatus machineStatus;;
    private String modalityName;

    public int getMachineId() {
        return machineId;
    }

    public void setMachineId(int machineId) {
        this.machineId = machineId;
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

    public String getModalityName() {
        return modalityName;
    }

    public void setModalityName(String modalityName) {
        this.modalityName = modalityName;
    }
}
