package com.spring.Specifications;

import com.spring.Enums.ScheduleStatus;
import com.spring.Models.Schedules;
import org.springframework.data.jpa.domain.Specification;

import java.time.DayOfWeek;
import java.time.LocalDateTime;

public class ScheduleSpecification {

    public static Specification<Schedules> hasStatus(ScheduleStatus scheduleStatus){
        return (root, query, criteriaBuilder) -> {
            if(scheduleStatus == null) return criteriaBuilder.notEqual(root.get("scheduleStatus"), ScheduleStatus.Archived);
            return criteriaBuilder.equal(root.get("scheduleStatus"), scheduleStatus);
        };
    }

    public static Specification<Schedules> toDoctor(String name){
        return (root, query, criteriaBuilder) -> {
            if (name == null) return null;
            String pattern = "%" + name.toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("doctor").get("firstName")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("doctor").get("lastName")), pattern)
            );
        };
    }

    public static Specification<Schedules> hasDepartment(String departmentName){
        return (root, query, criteriaBuilder) -> {
            if (departmentName == null) return null;
            return criteriaBuilder.equal(root.get("doctor").get("role").get("department").get("departmentName"), departmentName);
        };
    }

    public static Specification<Schedules> searchPatient(String patientName){
        return (root, query, criteriaBuilder) -> {
            if (patientName == null) return null;
            String pattern = "%" + patientName.toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("patient").get("firstName")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("patient").get("lastName")), pattern)
            );
        };
    }

    public static Specification<Schedules> byDateFilter(String filter) {
        return (root, query, criteriaBuilder) -> {
            if (filter == null || filter.equalsIgnoreCase("overall")) return null;

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime start;

            switch (filter.toLowerCase()) {
                case "daily":
                    start = now.toLocalDate().atStartOfDay();
                    break;
                case "weekly":
                    start = now.toLocalDate().with(DayOfWeek.MONDAY).atStartOfDay();
                    break;
                case "monthly":
                    start = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
                    break;
                case "yearly":
                    start = now.toLocalDate().withDayOfYear(1).atStartOfDay();
                    break;
                default:
                    return null;
            }

            return criteriaBuilder.between(root.get("startDateTime"), start, now);
        };
    }

    public static Specification<Schedules> upcomingOnly() {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(root.get("startDateTime"), LocalDateTime.now());
    }

}
