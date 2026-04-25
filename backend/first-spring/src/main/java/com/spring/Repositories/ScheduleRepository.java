package com.spring.Repositories;

import com.spring.Enums.ScheduleStatus;
import com.spring.Models.Schedules;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedules, Integer>, JpaSpecificationExecutor<Schedules> {

    Page<Schedules> findAll(Pageable pageable);
    Page<Schedules> searchByPatient_NameContainingIgnoreCase(String patientName, Pageable pageable);

    @Query("""
    SELECT COUNT(s) FROM Schedules s
    WHERE s.scheduleStatus = :scheduleStatus
    """)
    Long allSchedulesCount(@Param("scheduleStatus") ScheduleStatus scheduleStatus);


    // 1. Doctor double-booking (same department)
    @Query("""
    SELECT COUNT(s) > 0 FROM Schedules s
    WHERE s.scheduleId <> :excludeId
    AND s.scheduleStatus NOT IN ('Cancelled', 'Done', 'Archived')
    AND s.doctor.doctorId = :doctorId
    AND s.startDateTime < :endDateTime
    AND s.endDateTime > :startDateTime
""")
    boolean isDoctorBooked(
            @Param("excludeId") int excludeId,
            @Param("doctorId") int doctorId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    // 2. Machine double-booking
    @Query("""
    SELECT COUNT(s) > 0 FROM Schedules s
    WHERE s.scheduleId <> :excludeId
    AND s.scheduleStatus NOT IN ('Cancelled', 'Done', 'Archived')
    AND s.machine.machineId = :machineId
    AND s.startDateTime < :endDateTime
    AND s.endDateTime > :startDateTime
""")
    boolean isMachineBooked(
            @Param("excludeId") int excludeId,
            @Param("machineId") int machineId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    // 3. Room double-booking
    @Query("""
    SELECT COUNT(s) > 0 FROM Schedules s
    WHERE s.scheduleId <> :excludeId
    AND s.scheduleStatus NOT IN ('Cancelled', 'Done', 'Archived')
    AND s.room.roomId = :roomId
    AND s.startDateTime < :endDateTime
    AND s.endDateTime > :startDateTime
""")
    boolean isRoomBooked(
            @Param("excludeId") int excludeId,
            @Param("roomId") int roomId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );

    // 4. Patient double-booking (across ALL departments)
    @Query("""
    SELECT COUNT(s) > 0 FROM Schedules s
    WHERE s.scheduleId <> :excludeId
    AND s.scheduleStatus NOT IN ('Cancelled', 'Done', 'Archived')
    AND s.patient.patientId = :patientId
    AND s.startDateTime < :endDateTime
    AND s.endDateTime > :startDateTime
""")
    boolean isPatientBooked(
            @Param("excludeId") int excludeId,
            @Param("patientId") int patientId,
            @Param("startDateTime") LocalDateTime startDateTime,
            @Param("endDateTime") LocalDateTime endDateTime
    );
}
