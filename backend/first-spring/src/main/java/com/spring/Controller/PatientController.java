package com.spring.Controller;

import com.spring.Enums.PatientStatus;
import com.spring.Models.Patients;
import com.spring.Service.PatientService;
import com.spring.dto.PatientResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PatientController {
    private final PatientService patientService;

    public PatientController(PatientService patientService){
        this.patientService = patientService;
    }

    //READ & FILTER
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getPatients")
    public ResponseEntity<Page<PatientResponseDTO>> getPatients(
            @RequestParam(required = false) PatientStatus patientStatus,
            Pageable pageable
            ){
        return ResponseEntity.ok(patientService.getPatients(patientStatus, pageable));
    }

    //SEARCH WITH FILTER
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("searchPatient/{name}")
    public ResponseEntity<Page<PatientResponseDTO>> searchPatient(
            @PathVariable String name,
            Pageable pageable
    ){
        return ResponseEntity.ok(patientService.searchPatients(name, pageable));
    }

    //SEARCH UNPAGINATED
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    @GetMapping("SearchName/{name}")
    public ResponseEntity<List<PatientResponseDTO>> SearchPatient(@PathVariable String name){
        return ResponseEntity.ok(patientService.SearchPatient(name));
    }

    //UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("updatePatient/{patientId}")
    public ResponseEntity<SuccessResponse> updatePatient(
            @PathVariable int patientId,
            @RequestBody Patients patient
    ){
        patientService.updatePatient(patientId, patient);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Patient Updated"));
    }

    //ARCHIVE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("archivePatient/{patientId}")
    public ResponseEntity<SuccessResponse> archivePatient(
            @PathVariable int patientId
    ){
        patientService.archivePatient(patientId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Patient Archived"));
    }

    //RESTORE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("restorePatient/{patientId}")
    public ResponseEntity<SuccessResponse> restorePatient(
            @PathVariable int patientId
    ){
        patientService.restorePatient(patientId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Patient Restored"));
    }


}
