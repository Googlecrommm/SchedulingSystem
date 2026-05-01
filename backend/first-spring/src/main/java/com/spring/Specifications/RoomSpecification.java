package com.spring.Specifications;

import com.spring.Enums.MachineStatus;
import com.spring.Enums.SoftDelete;
import com.spring.Models.Rooms;
import org.springframework.data.jpa.domain.Specification;

public class RoomSpecification {
    public static Specification<Rooms> hasStatus(MachineStatus roomStatus){
        return (root, query, criteriaBuilder) -> {
            if (roomStatus == null)
                return criteriaBuilder.notEqual(root.get("roomStatus"), MachineStatus.Archived);
            return criteriaBuilder.equal(root.get("roomStatus"), roomStatus);
        };
    }

    public static Specification<Rooms> hasDepartment(String departmentName){
        return (root, query, criteriaBuilder) -> {
            if (departmentName == null) return null;
            return criteriaBuilder.equal(root.get("department").get("departmentName"), departmentName);
        };
    }
}
