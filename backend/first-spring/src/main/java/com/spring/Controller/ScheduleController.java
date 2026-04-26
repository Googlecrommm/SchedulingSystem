package com.spring.Controller;

import com.spring.Enums.ScheduleStatus;
import com.spring.Models.Schedules;
import com.spring.Service.ScheduleService;
import com.spring.dto.CreatePatientWithScheduleResponseDTO;
import com.spring.dto.SchedulePatchRequest;
import com.spring.dto.ScheduleResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ScheduleController {
    private final ScheduleService scheduleService;

    public ScheduleController(ScheduleService scheduleService){
        this.scheduleService = scheduleService;
    }

    //CREATE
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("createScheduleAndPatient")
    public ResponseEntity<SuccessResponse> createScheduleAndPatient(@RequestBody CreatePatientWithScheduleResponseDTO schedulePatientDTO){
        scheduleService.createScheduleAndPatient(schedulePatientDTO);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Schedule Added"));
    }

    //READ & FILTER
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getSchedules")
    public ResponseEntity<Page<ScheduleResponseDTO>> getSchedules(
            @RequestParam(required = false) ScheduleStatus scheduleStatus,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String departmentName,
            @RequestParam(required = false) String patientName,
            Pageable pageable){
        return ResponseEntity.ok(scheduleService.getSchedules(scheduleStatus, name, patientName, departmentName, pageable));
    }

    //READ & FILTER (RADIOLOGY)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getRadiologySched")
    public ResponseEntity<Page<ScheduleResponseDTO>> getRadiologySched(
            @RequestParam(required = false) ScheduleStatus scheduleStatus,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String patientName,
            Pageable pageable
    ){
        return ResponseEntity.ok(scheduleService.getRadiologySched(scheduleStatus, name, patientName, pageable));
    }

    //READ & FILTER (REHABILITATION)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getRehabSched")
    public ResponseEntity<Page<ScheduleResponseDTO>> getRehabSched(
            @RequestParam(required = false) ScheduleStatus scheduleStatus,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String patientName,
            Pageable pageable
    ){
        return ResponseEntity.ok(scheduleService.getRehabSched(scheduleStatus, name, patientName, pageable));
    }

    //SEARCH
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("searchSchedule/{patientName}")
    public ResponseEntity<Page<ScheduleResponseDTO>> searchSchedule(
            @PathVariable String patientName,
            Pageable pageable
    ){
        return ResponseEntity.ok(scheduleService.searchSchedule(patientName, pageable));
    }

    //COUNT ALL SCHEDULES
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("dashboard/counts")
    public ResponseEntity<Map<String, Long>> getDashboardCounts(
            @RequestParam(required = false) String department,
            @RequestParam(defaultValue = "overall") String filter
    ) {
        return ResponseEntity.ok(scheduleService.getDashboardCounts(department, filter));
    }

    //COUNT ALL SCHEDULES (RADIOLOGY)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("dashboard/countRadio")
    public ResponseEntity<Map<String, Long>> getDashboardCounts(
            @RequestParam(defaultValue = "overall") String filter
    ) {
        return ResponseEntity.ok(scheduleService.getDashboardCountsRadio(filter));
    }

    //COUNT ALL SCHEDULES (REHABILITATION)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("dashboard/countRehab")
    public ResponseEntity<Map<String, Long>> getDashboardCountsRehab(
            @RequestParam(defaultValue = "overall") String filter
    ) {
        return ResponseEntity.ok(scheduleService.getDashboardCountsRehab(filter));
    }


    //UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("updateSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> updateSchedule(
            @PathVariable int scheduleId,
            @RequestBody SchedulePatchRequest schedulePatchRequest){
        scheduleService.patchSchedule(scheduleId, schedulePatchRequest);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Schedule Update"));
    }

    //ARCHIVE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("archiveSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> archiveSchedule(@PathVariable int scheduleId){
        scheduleService.archiveSchedule(scheduleId);
        return ResponseEntity.ok().body(new SuccessResponse(200,"Schedule Archived"));
    }

    //CANCELLED
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("cancelSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> cancelSchedule(@PathVariable int scheduleId){
        scheduleService.cancelSchedule(scheduleId);
        return ResponseEntity.ok().body(new SuccessResponse(200,"Schedule Cancelled"));
    }

    //CONFIRMED
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("confirmSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> confirmSchedule(@PathVariable int scheduleId){
        scheduleService.confirmSchedule(scheduleId);
        return ResponseEntity.ok().body(new SuccessResponse(200,"Schedule Confirmed"));
    }

    //DONE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("doneSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> doneSchedule(@PathVariable int scheduleId){
        scheduleService.doneSchedule(scheduleId);
        return ResponseEntity.ok().body(new SuccessResponse(200,"Schedule Marked as Done"));
    }

    //RESTORE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("restoreSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> restoreSchedule(@PathVariable int scheduleId){
        scheduleService.restoreSchedule(scheduleId);
        return ResponseEntity.ok().body(new SuccessResponse(200,"Schedule Marked as Scheduled"));
    }
}
