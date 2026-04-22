package com.spring.Models;

import com.spring.Enums.SoftDelete;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

@Entity
@Table(name = "hospitalization_type")
public class HospitalizationType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int typeId;

    @NotBlank
    @Size(max = 100)
    @Column(name = "typeName", nullable = false, length = 100)
    private String typeName;

    @Column(name = "typeStatus", nullable = false)
    private SoftDelete typeStatus = SoftDelete.Active;

    @OneToMany(mappedBy = "hospitalizationType")
    private List<Schedules> schedules;

    public HospitalizationType(){};

    public int getTypeId() {
        return typeId;
    }

    public void setTypeId(int typeId) {
        this.typeId = typeId;
    }

    public String getTypeName() {
        return typeName;
    }

    public void setTypeName(String typeName) {
        this.typeName = typeName;
    }

    public SoftDelete getTypeStatus() {
        return typeStatus;
    }

    public void setTypeStatus(SoftDelete typeStatus) {
        this.typeStatus = typeStatus;
    }

    public List<Schedules> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<Schedules> schedules) {
        this.schedules = schedules;
    }


}
