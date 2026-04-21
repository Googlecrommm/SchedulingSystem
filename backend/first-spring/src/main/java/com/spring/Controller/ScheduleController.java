package com.spring.Controller;

import com.spring.Enums.ScheduleStatus;
import com.spring.Service.ScheduleService;
import com.spring.dto.CreatePatientWithScheduleResponseDTO;
import com.spring.dto.ScheduleResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
            Pageable pageable){
        return ResponseEntity.ok(scheduleService.getSchedules(scheduleStatus, name, pageable));

    }
}
