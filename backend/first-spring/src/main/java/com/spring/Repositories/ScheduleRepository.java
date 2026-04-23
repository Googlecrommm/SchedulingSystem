package com.spring.Repositories;

import com.spring.Models.Schedules;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedules, Integer>, JpaSpecificationExecutor<Schedules> {

    Page<Schedules> findAll(Pageable pageable);

    @Query("""
    SELECT s FROM Schedules s
    WHERE s.scheduleId <> :excludeId
    AND s.doctor.role.department.departmentId = :departmentId
    AND s.scheduleStatus NOT IN ('Cancelled', 'Completed')
    AND (
        s.doctor.doctorId = :doctorId
        OR (:machineId IS NOT NULL AND s.machine.machineId = :machineId)
        OR s.patient.patientId = :patientId
    )
    AND s.startDateTime < :endDateTime
    AND s.endDateTime > :startDateTime
""")
    List<Schedules> findConflictingSchedules(
            @Param("excludeId") int excludeId,
            @Param("departmentId") int departmentId,
            @Param("doctorId") int doctorId,
            @Param("machineId") Integer machineId,
            @Param("patientId") int patientId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );
}
