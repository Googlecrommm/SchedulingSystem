package com.spring.Specifications;

import com.spring.Models.Doctors;
import org.springframework.data.jpa.domain.Specification;

public class DoctorSpecification {

    public static Specification<Doctors> hasStatus(String availabilityStatus){
        return (root, query, criteriaBuilder) -> {
            if(availabilityStatus == null) return null;
            return criteriaBuilder.equal(root.get("availabilityStatus"), availabilityStatus);
        };
    }
}
