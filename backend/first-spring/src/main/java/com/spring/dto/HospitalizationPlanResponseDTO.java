package com.spring.dto;

import com.spring.Enums.SoftDelete;

public class HospitalizationPlanResponseDTO {
    private int planId;
    private String code;
    private String companyName;
    private SoftDelete planStatus;

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
}
