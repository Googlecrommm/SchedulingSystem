package com.spring.Specifications;

import com.spring.Models.Users;
import org.springframework.data.jpa.domain.Specification;

public class UserSpecification {
    public static Specification<Users> hasAccountStatus(String accountStatus){
        return (root, query, criteriaBuilder) -> {
            if(accountStatus == null) return null;
            return criteriaBuilder.equal(root.get("accountStatus"), accountStatus);
        };
    }

    public static Specification<Users> hasDepartment(String departmentName){
        return (root, query, criteriaBuilder) -> {
            if(departmentName == null) return null;
            return criteriaBuilder.equal(root.get("role").get("department").get("departmentName"), departmentName);
        };
    }

    public static Specification<Users> hasRole(String roleName){
        return (root, query, criteriaBuilder) -> {
            if(roleName == null) return null;
            return criteriaBuilder.equal(root.get("role").get("roleName"), roleName);
        };
    }
}
