package com.spring.Controller;

import com.spring.Models.Doctors;
import com.spring.Security.DepartmentSecurityHelper;
import com.spring.Service.DoctorService;
import com.spring.dto.DoctorsResponseDTO;
import com.spring.dto.SuccessResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DoctorController {
    private final DoctorService doctorService;
    private final DepartmentSecurityHelper departmentSecurityHelper;

    public DoctorController(DoctorService doctorService, DepartmentSecurityHelper departmentSecurityHelper) {
        this.doctorService = doctorService;
        this.departmentSecurityHelper = departmentSecurityHelper;
    }

    //CREATE
    @PreAuthorize("isAuthenticated()")
    @PostMapping("createDoctor")
    public ResponseEntity<SuccessResponse> createDoctor(
            @Valid @RequestBody Doctors doctor,
            Authentication authentication) {
        doctorService.addDoctor(doctor, authentication);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Doctor Added"));
    }

    //READ & FILTER — all roles, department scoped via helper
    // REPLACES: getRadiologist, getTherapist
    @PreAuthorize("isAuthenticated()")
    @GetMapping("getDoctors")
    public ResponseEntity<Page<DoctorsResponseDTO>> getDoctors(
            @RequestParam(required = false) String availabilityStatus,
            @RequestParam(required = false) String roleName,
            @RequestParam(required = false) String departmentName,
            Pageable pageable,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(departmentName, authentication);

        return ResponseEntity.ok(
                doctorService.getDoctors(availabilityStatus, roleName, effectiveDept, pageable));
    }

    // DELETED: getRadiologist  — use getDoctors?departmentName=Radiology
    // DELETED: getTherapist    — use getDoctors?departmentName=Rehabilitation

    //SEARCH — all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("searchDoctor/{searchName}")
    public ResponseEntity<Page<DoctorsResponseDTO>> searchDoctor(
            @PathVariable String searchName,
            Pageable pageable,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(null, authentication);

        return ResponseEntity.ok(
                doctorService.searchDoctor(searchName, effectiveDept, pageable));
    }

    //DROPDOWN — single endpoint replaces doctorDropdown, therapistDropdown, radiologistDropdown
    // admin → all available doctors
    // department user → only available doctors in their department
    @PreAuthorize("isAuthenticated()")
    @GetMapping("doctorDropdown")
    public ResponseEntity<List<DoctorsResponseDTO>> doctorDropdown(Authentication authentication) {
        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(null, authentication);

        return ResponseEntity.ok(doctorService.doctorDropdown(effectiveDept));
    }

    // DELETED: therapistDropdown    — replaced by doctorDropdown (scoped automatically)
    // DELETED: radiologistDropdown  — replaced by doctorDropdown (scoped automatically)

    //UPDATE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("updateDoctor/{doctorId}")
    public ResponseEntity<SuccessResponse> updateDoctor(
            @PathVariable int doctorId,
            @RequestBody Doctors doctor) {
        doctorService.updateDoctor(doctorId, doctor);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Doctor Updated"));
    }

    //MARK AS ON LEAVE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("leaveDoctor/{doctorId}")
    public ResponseEntity<SuccessResponse> markLeave(@PathVariable int doctorId) {
        doctorService.markLeave(doctorId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Marked as On Leave"));
    }

    //MARK AS UNAVAILABLE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("unavailableDoctor/{doctorId}")
    public ResponseEntity<SuccessResponse> markUnavailable(@PathVariable int doctorId) {
        doctorService.markUnavailable(doctorId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Marked as Unavailable"));
    }

    //MARK AS AVAILABLE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("availableDoctor/{doctorId}")
    public ResponseEntity<SuccessResponse> markAvailable(@PathVariable int doctorId) {
        doctorService.markAvailable(doctorId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Marked as Available"));
    }
}