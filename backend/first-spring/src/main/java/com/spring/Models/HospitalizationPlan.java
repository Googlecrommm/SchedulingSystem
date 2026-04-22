package com.spring.Models;

import com.spring.Enums.SoftDelete;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

@Entity
@Table(name = "hospitalization_plan")
public class HospitalizationPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private int planId;

    @NotBlank
    @Size(max = 10)
    @Column(name = "code", nullable = false, length = 10)
    private String code;

    @NotBlank
    @Size(max = 100)
    @Column(name = "companyName", nullable = false, length = 100)
    private String companyName;

    @Enumerated(EnumType.STRING)
    @Column(name = "planStatus", nullable = false)
    private SoftDelete planStatus = SoftDelete.Active;

    @OneToMany(mappedBy = "hospitalizationPlan")
    private List<Schedules> schedules;

    public HospitalizationPlan(){};

    public int getPlanId() {
        return planId;
    }

    public void setPlanId(int planId) {
        this.planId = planId;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public SoftDelete getPlanStatus() {
        return planStatus;
    }

    public void setPlanStatus(SoftDelete planStatus) {
        this.planStatus = planStatus;
    }

    public List<Schedules> getSchedules() {
        return schedules;
    }

    public void setSchedules(List<Schedules> schedules) {
        this.schedules = schedules;
    }
}
