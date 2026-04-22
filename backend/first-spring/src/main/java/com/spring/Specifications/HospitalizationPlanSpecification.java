package com.spring.Specifications;

import com.spring.Enums.SoftDelete;
import com.spring.Models.HospitalizationPlan;
import org.springframework.data.jpa.domain.Specification;

public class HospitalizationPlanSpecification {

    public static Specification<HospitalizationPlan> hasStatus(SoftDelete planStatus){
        return (root, query, criteriaBuilder) -> {
            if (planStatus == null) return null;
            return criteriaBuilder.equal(root.get("planStatus"), planStatus);
        };
    }
}
