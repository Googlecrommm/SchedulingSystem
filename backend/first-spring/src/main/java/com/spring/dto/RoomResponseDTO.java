package com.spring.dto;

import com.spring.Enums.MachineStatus;

public class RoomResponseDTO {
    private int roomId;
    private String roomName;
    private MachineStatus roomStatus;
    private String departmentName;

    public int getRoomId() {
        return roomId;
    }

    public void setRoomId(int roomId) {
        this.roomId = roomId;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public MachineStatus getRoomStatus() {
        return roomStatus;
    }

    public void setRoomStatus(MachineStatus roomStatus) {
        this.roomStatus = roomStatus;
    }

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }
}
