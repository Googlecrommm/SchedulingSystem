package com.spring.Specifications;

import com.spring.Enums.SoftDelete;
import com.spring.Models.Departments;
import org.springframework.data.jpa.domain.Specification;

public class DepartmentSpecification {

    public static Specification<Departments> hasStatus(String departmentStatus){
        return (root, query, criteriaBuilder) -> {
            if(departmentStatus == null)
                return criteriaBuilder.notEqual(root.get("departmentStatus"), SoftDelete.Archived);
            return criteriaBuilder.equal(root.get("departmentStatus"), departmentStatus);
        };
    }

    public static Specification<Departments> excludeDept(){
        return (root, query, criteriaBuilder) -> {
            return criteriaBuilder.notEqual(root.get("departmentName"), "ICTD");
        };
    }
}
