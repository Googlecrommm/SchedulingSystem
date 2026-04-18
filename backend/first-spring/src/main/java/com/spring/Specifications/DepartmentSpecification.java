package com.spring.Specifications;

import com.spring.Models.Departments;
import org.springframework.data.jpa.domain.Specification;

public class DepartmentSpecification {

    public static Specification<Departments> hasStatus(String departmentStatus){
        return (root, query, criteriaBuilder) -> {
            if(departmentStatus == null) return null;
            return criteriaBuilder.equal(root.get("departmentStatus"), departmentStatus);
        };
    }
}
