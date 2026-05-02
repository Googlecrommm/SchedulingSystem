package com.spring.Controller;

import com.spring.Enums.ScheduleStatus;
import com.spring.Security.DepartmentSecurityHelper;
import com.spring.Service.ScheduleService;
import com.spring.dto.CreatePatientWithScheduleResponseDTO;
import com.spring.dto.SchedulePatchRequest;
import com.spring.dto.ScheduleResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ScheduleController {
    private final ScheduleService scheduleService;
    private final DepartmentSecurityHelper departmentSecurityHelper;

    public ScheduleController(ScheduleService scheduleService, DepartmentSecurityHelper departmentSecurityHelper){
        this.scheduleService = scheduleService;
        this.departmentSecurityHelper = departmentSecurityHelper;
    }

    @PreAuthorize("hasRole('FRONTDESK')")
    @PostMapping("createScheduleAndPatient")
    public ResponseEntity<SuccessResponse> createScheduleAndPatient(
            @RequestBody CreatePatientWithScheduleResponseDTO schedulePatientDTO,
            Authentication authentication){
        scheduleService.createScheduleAndPatient(schedulePatientDTO, authentication);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Schedule Added"));
    }

    //READ & FILTER — single endpoint, all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("getSchedules")
    public ResponseEntity<Page<ScheduleResponseDTO>> getSchedules(
            @RequestParam(required = false) ScheduleStatus scheduleStatus,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String patientName,
            @RequestParam(required = false) String departmentName,
            @RequestParam(required = false) String modalityName,
            Pageable pageable,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(departmentName, authentication);

        return ResponseEntity.ok(
                scheduleService.getSchedules(scheduleStatus, name, patientName, effectiveDept, modalityName, pageable));
    }

    // DELETED: getRadiologySched()  — replaced by getSchedules() with departmentName param
    // DELETED: getRehabSched()      — replaced by getSchedules() with departmentName param

    //SEARCH
    @PreAuthorize("isAuthenticated()")
    @GetMapping("searchSchedule/{patientName}")
    public ResponseEntity<Page<ScheduleResponseDTO>> searchSchedule(
            @PathVariable String patientName,
            Pageable pageable){
        return ResponseEntity.ok(scheduleService.searchSchedule(patientName, pageable));
    }

    //DASHBOARD COUNTS — single endpoint, all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("dashboard/counts")
    public ResponseEntity<Map<String, Long>> getDashboardCounts(
            @RequestParam(required = false) String departmentName,
            @RequestParam(defaultValue = "overall") String filter,
            @RequestParam(required = false) String modalityName,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(departmentName, authentication);

        return ResponseEntity.ok(scheduleService.getDashboardCounts(effectiveDept, filter, modalityName));
    }

    //DASHBOARD MONTHLY BREAKDOWN — single endpoint, all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("dashboard/monthly-breakdown")
    public ResponseEntity<Map<String, Long>> getMonthlyBreakdown(
            @RequestParam(required = false) String departmentName,
            @RequestParam(required = false) String modalityName,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(departmentName, authentication);

        return ResponseEntity.ok(scheduleService.getMonthlyBreakdown(effectiveDept, modalityName));
    }

    // DELETED: dashboard/countRadio  — replaced by dashboard/counts with departmentName param
    // DELETED: dashboard/countRehab  — replaced by dashboard/counts with departmentName param

    //UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping("updateSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> updateSchedule(
            @PathVariable int scheduleId,
            @RequestBody SchedulePatchRequest schedulePatchRequest,
            Authentication authentication) {
        scheduleService.patchSchedule(scheduleId, schedulePatchRequest, authentication);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Schedule Updated"));
    }

    //ARCHIVE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("archiveSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> archiveSchedule(@PathVariable int scheduleId){
        scheduleService.archiveSchedule(scheduleId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Schedule Archived"));
    }

    //CANCELLED
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("cancelSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> cancelSchedule(@PathVariable int scheduleId){
        scheduleService.cancelSchedule(scheduleId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Schedule Cancelled"));
    }

    //CONFIRMED
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("confirmSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> confirmSchedule(@PathVariable int scheduleId){
        scheduleService.confirmSchedule(scheduleId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Schedule Confirmed"));
    }

    //DONE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("doneSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> doneSchedule(@PathVariable int scheduleId){
        scheduleService.doneSchedule(scheduleId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Schedule Marked as Done"));
    }

    //RESTORE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("restoreSchedule/{scheduleId}")
    public ResponseEntity<SuccessResponse> restoreSchedule(@PathVariable int scheduleId){
        scheduleService.restoreSchedule(scheduleId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Schedule Marked as Scheduled"));
    }

    //PRINT — department scoped via helper so non-admins can only export their own dept
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam(required = false) String departmentName,
            @RequestParam(defaultValue = "overall") String filter,
            @RequestParam(required = false) String modalityName,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(departmentName, authentication);

        byte[] pdf = scheduleService.exportSchedulesToPdf(effectiveDept, filter, modalityName);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=schedules-" + filter + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}