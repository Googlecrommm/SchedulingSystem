package com.spring.dto;

import com.spring.Enums.SoftDelete;

public class HospitalizationTypeResponseDTO {
    private int typeId;
    private String typeName;
    private SoftDelete typeStatus;

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
}
