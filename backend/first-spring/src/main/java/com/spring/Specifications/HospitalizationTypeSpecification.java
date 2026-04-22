package com.spring.Specifications;

import com.spring.Enums.SoftDelete;
import com.spring.Models.HospitalizationType;
import org.springframework.data.jpa.domain.Specification;

public class HospitalizationTypeSpecification {

    public static Specification<HospitalizationType> hasStatus(SoftDelete typeStatus){
        return (root, query, criteriaBuilder) -> {
            if (typeStatus == null) return null;
            return criteriaBuilder.equal(root.get("typeStatus"), typeStatus);
        };
    }
}
