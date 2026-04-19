package com.spring.dto;

import com.spring.Enums.SoftDelete;

public class ModalityResponseDTO {
    private int modalityId;
    private String modalityName;
    private SoftDelete modalityStatus;
    private String departmentName;

    public int getModalityId() {
        return modalityId;
    }

    public void setModalityId(int modalityId) {
        this.modalityId = modalityId;
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

    public String getDepartmentName() {
        return departmentName;
    }

    public void setDepartmentName(String departmentName) {
        this.departmentName = departmentName;
    }
}
