package com.spring.Models;

import com.spring.Enums.SoftDelete;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

@Entity
@Table(name = "rooms")
public class Rooms {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int roomId;

    @OneToMany(mappedBy = "room")
    private List<Schedules> schedules;

    @ManyToOne
    @JoinColumn(name = "departmentId", nullable = false)
    private Departments department;

    @NotBlank
    @Size(max = 100)
    @Column(name = "roomName", nullable = false, length = 100)
    private String roomName;

    @Enumerated(EnumType.STRING)
    @Column(name = "roomStatus", nullable = false)
    private SoftDelete roomStatus = SoftDelete.Active;

    public Rooms(){}

    public int getRoomId() {
        return roomId;
    }

    public void setRoomId(int roomId) {
        this.roomId = roomId;
    }

    public Departments getDepartment() {
        return department;
    }

    public void setDepartment(Departments department) {
        this.department = department;
    }

    public List<Schedules> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<Schedules> schedules) {
        this.schedules = schedules;
    }

    public String getRoomName() {
        return roomName;
    }

    public void setRoomName(String roomName) {
        this.roomName = roomName;
    }

    public SoftDelete getRoomStatus() {
        return roomStatus;
    }

    public void setRoomStatus(SoftDelete roomStatus) {
        this.roomStatus = roomStatus;
    }


}
