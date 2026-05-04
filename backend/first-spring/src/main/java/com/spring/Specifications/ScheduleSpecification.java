package com.spring.Specifications;

import com.spring.Enums.ScheduleStatus;
import com.spring.Models.Schedules;
import jakarta.persistence.criteria.JoinType;
import org.springframework.data.jpa.domain.Specification;

import java.time.DayOfWeek;
import java.time.LocalDateTime;

public class ScheduleSpecification {

    // Used for schedule list page — hides Archived when null
    public static Specification<Schedules> hasStatus(ScheduleStatus scheduleStatus) {
        return (root, query, criteriaBuilder) -> {
            if (scheduleStatus == null) return criteriaBuilder.notEqual(root.get("scheduleStatus"), ScheduleStatus.Archived);
            return criteriaBuilder.equal(root.get("scheduleStatus"), scheduleStatus);
        };
    }

    // Used for dashboard — counts exact status, no hidden exclusions
    public static Specification<Schedules> hasExactStatus(ScheduleStatus scheduleStatus) {
        return (root, query, criteriaBuilder) -> {
            if (scheduleStatus == null) return null;
            return criteriaBuilder.equal(root.get("scheduleStatus"), scheduleStatus);
        };
    }

    public static Specification<Schedules> toDoctor(String name) {
        return (root, query, criteriaBuilder) -> {
            if (name == null) return null;
            String pattern = "%" + name.toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("doctor").get("firstName")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("doctor").get("lastName")), pattern)
            );
        };
    }

    public static Specification<Schedules> hasDepartment(String departmentName) {
        return (root, query, criteriaBuilder) -> {
            if (departmentName == null) return null;
            return criteriaBuilder.equal(
                    root.get("doctor").get("role").get("department").get("departmentName"), departmentName);
        };
    }

    // Uses LEFT join so schedules without a machine are not excluded
    public static Specification<Schedules> hasModality(String modalityName) {
        return (root, query, criteriaBuilder) -> {
            if (modalityName == null) return null;
            var machine = root.join("machine", JoinType.LEFT);
            var modality = machine.join("modality", JoinType.LEFT);
            return criteriaBuilder.equal(modality.get("modalityName"), modalityName);
        };
    }

    public static Specification<Schedules> searchPatient(String patientName) {
        return (root, query, criteriaBuilder) -> {
            if (patientName == null) return null;
            String pattern = "%" + patientName.toLowerCase() + "%";
            return criteriaBuilder.or(
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("patient").get("firstName")), pattern),
                    criteriaBuilder.like(criteriaBuilder.lower(root.get("patient").get("lastName")), pattern)
            );
        };
    }

    // FIXED:
    // 1. Added "today" as alias for "daily" — controller sends "today" by default
    // 2. Changed upper bound from `now` to end of period — so future schedules
    //    within the same week/month/year are included in counts
    public static Specification<Schedules> byDateFilter(String filter) {
        return (root, query, criteriaBuilder) -> {
            if (filter == null || filter.equalsIgnoreCase("overall")) return null;

            LocalDateTime now = LocalDateTime.now();
            LocalDateTime start;
            LocalDateTime end;

            switch (filter.toLowerCase()) {
                case "today":
                case "daily":
                    start = now.toLocalDate().atStartOfDay();
                    end = now.toLocalDate().atTime(23, 59, 59);
                    break;
                case "weekly":
                    start = now.toLocalDate().with(DayOfWeek.MONDAY).atStartOfDay();
                    end = now.toLocalDate().with(DayOfWeek.SUNDAY).atTime(23, 59, 59);
                    break;
                case "monthly":
                    start = now.toLocalDate().withDayOfMonth(1).atStartOfDay();
                    end = now.toLocalDate().withDayOfMonth(
                            now.toLocalDate().lengthOfMonth()).atTime(23, 59, 59);
                    break;
                case "yearly":
                    start = now.toLocalDate().withDayOfYear(1).atStartOfDay();
                    end = now.toLocalDate().withDayOfYear(
                            now.toLocalDate().lengthOfYear()).atTime(23, 59, 59);
                    break;
                default:
                    return null;
            }

            return criteriaBuilder.between(root.get("startDateTime"), start, end);
        };
    }

    public static Specification<Schedules> upcomingOnly() {
        return (root, query, criteriaBuilder) ->
                criteriaBuilder.greaterThanOrEqualTo(root.get("startDateTime"), LocalDateTime.now());
    }
}