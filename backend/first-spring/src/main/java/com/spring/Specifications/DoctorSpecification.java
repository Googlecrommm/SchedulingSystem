package com.spring.Specifications;

import com.spring.Enums.DoctorStatus;
import com.spring.Models.Doctors;
import org.springframework.data.jpa.domain.Specification;

public class DoctorSpecification {

    public static Specification<Doctors> hasStatus(DoctorStatus availabilityStatus) {
        return (root, query, criteriaBuilder) -> {
            if (availabilityStatus == null) return criteriaBuilder.notEqual(root.get("availabilityStatus"), DoctorStatus.Unavailable);
            return criteriaBuilder.equal(root.get("availabilityStatus"), availabilityStatus);
        };
    }

    public static Specification<Doctors> hasRole(String roleName) {
        return (root, query, criteriaBuilder) -> {
            if (roleName == null) return null;
            return criteriaBuilder.equal(root.get("role").get("roleName"), roleName);
        };
    }

    // ADDED — scopes doctors to a specific department via role → department
    public static Specification<Doctors> hasDepartment(String departmentName) {
        return (root, query, criteriaBuilder) -> {
            if (departmentName == null) return null;
            return criteriaBuilder.equal(
                    root.get("role").get("department").get("departmentName"), departmentName);
        };
    }
}