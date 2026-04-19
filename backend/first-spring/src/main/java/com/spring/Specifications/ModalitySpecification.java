package com.spring.Specifications;

import com.spring.Models.Modalities;
import org.springframework.data.jpa.domain.Specification;

public class ModalitySpecification {

    public static Specification<Modalities> hasStatus(String modalityStatus){
        return (root, query, criteriaBuilder) -> {
            if (modalityStatus == null) return null;
            return criteriaBuilder.equal(root.get("modalityStatus"), modalityStatus);
        };
    }

    public static Specification<Modalities> hasDepartment(String departmentName){
        return (root, query, criteriaBuilder) -> {
            if (departmentName == null) return null;
            return criteriaBuilder.equal(root.get("department").get("departmentName"), departmentName);
        };
    }
}
