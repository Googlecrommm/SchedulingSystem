package com.spring.Models;

import com.spring.Enums.SoftDelete;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

@Entity
@Table(name = "modalities")
public class Modalities {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int modalityId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "departmentId", nullable = false)
    private Departments department;

    @NotBlank
    @Size(max = 100)
    @Column(name = "modalityName", nullable = false, length = 100)
    private String modalityName;

    @Enumerated(EnumType.STRING)
    @Column(name = "modalityStatus", nullable = false)
    private SoftDelete modalityStatus;

    @OneToMany(mappedBy = "modality")
    private List<Machines> machines;

    public int getModalityId() {
        return modalityId;
    }

    public void setModalityId(int modalityId) {
        this.modalityId = modalityId;
    }

    public Departments getDepartment() {
        return department;
    }

    public void setDepartment(Departments department) {
        this.department = department;
    }

    public String getModalityName() {
        return modalityName;
    }

    public void setModalityName(String modalityName) {
        this.modalityName = modalityName;
    }

    public SoftDelete getModalityStatus() {
        return modalityStatus;
    }

    public void setModalityStatus(SoftDelete modalityStatus) {
        this.modalityStatus = modalityStatus;
    }

    public List<Machines> getMachines() {
        return machines;
    }

    public void setMachines(List<Machines> machines) {
        this.machines = machines;
    }
}
