package com.spring.Specifications;

import com.spring.Models.Machines;
import org.springframework.data.jpa.domain.Specification;

public class MachineSpecification {

    public static Specification<Machines> hasStatus(String machineStatus){
        return (root, query, criteriaBuilder) -> {
            if(machineStatus == null) return null;
            return criteriaBuilder.equal(root.get("machineStatus"), machineStatus);
        };
    }

    public static Specification<Machines> hasModality(String modalityName){
        return (root, query, criteriaBuilder) -> {
            if(modalityName == null) return null;
            return criteriaBuilder.equal(root.get("modality").get("modalityName"), modalityName);
        };
    }
}
