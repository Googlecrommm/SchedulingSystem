package com.spring.Specifications;

import com.spring.Models.Roles;
import org.springframework.data.jpa.domain.Specification;

public class RoleSpecification {

    public static Specification<Roles> hasStatus(String status){
        return (root, query, criteriaBuilder) -> {
            if(status == null) return null;
            return criteriaBuilder.equal(root.get("roleStatus"), status);
        };
    }

    public static Specification<Roles> hasDepartment(String departmentName){
        return (root, query, criteriaBuilder) -> {
            if(departmentName == null) return null;
            return criteriaBuilder.equal(root.get("department").get("departmentName"), departmentName);
        };
    }

    public static Specification<Roles> excludeRole(){
        return (root, query, criteriaBuilder) -> {
            return criteriaBuilder.notEqual(root.get("roleName"), "Admin");
        };
    }
}
