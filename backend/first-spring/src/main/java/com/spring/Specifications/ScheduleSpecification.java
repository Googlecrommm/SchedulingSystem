package com.spring.Specifications;

import com.spring.Enums.ScheduleStatus;
import com.spring.Models.Schedules;
import org.springframework.data.jpa.domain.Specification;

public class ScheduleSpecification {

    public static Specification<Schedules> hasStatus(ScheduleStatus scheduleStatus){
        return (root, query, criteriaBuilder) -> {
            if(scheduleStatus == null) return null;
            return criteriaBuilder.equal(root.get("scheduleStatus"), scheduleStatus);
        };
    }

    public static Specification<Schedules> toDoctor(String name){
        return (root, query, criteriaBuilder) -> {
            if (name == null) return null;
            return criteriaBuilder.equal(root.get("doctor").get("name"), name);
        };
    }


}
