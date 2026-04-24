package com.spring.Specifications;

import com.spring.Enums.PatientStatus;
import com.spring.Models.Patients;
import org.springframework.data.jpa.domain.Specification;

public class PatientSpecification {

    public static Specification<Patients> hasStatus(PatientStatus patientStatus){
        return (root, query, criteriaBuilder) -> {
            if (patientStatus == null) return null;
            return criteriaBuilder.equal(root.get("status"), patientStatus);
        };
    }
}
