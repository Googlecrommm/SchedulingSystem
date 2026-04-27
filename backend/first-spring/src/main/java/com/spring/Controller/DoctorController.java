package com.spring.Controller;

import com.spring.Models.Doctors;
import com.spring.Service.DoctorService;
import com.spring.dto.DoctorsResponseDTO;
import com.spring.dto.SuccessResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class DoctorController {
   private final DoctorService doctorService;

   public DoctorController(DoctorService doctorService){
       this.doctorService = doctorService;
   }

    //CREATE
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("createDoctor")
    public ResponseEntity<SuccessResponse> createDoctor(@Valid @RequestBody Doctors doctor){
       doctorService.addDoctor(doctor);
       return ResponseEntity.ok().body(new SuccessResponse(200,"Doctor Added"));
    }

    //READ & FILTER
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getDoctors")
    public ResponseEntity<Page<DoctorsResponseDTO>> getDoctors(
            @RequestParam(required = false) String availabilityStatus,
            @RequestParam(required = false) String roleName,
            Pageable pageable
    ){
       return ResponseEntity.ok(doctorService.getDoctors(availabilityStatus, roleName, pageable));
    }

    //READ & FILTER (RADIOLOGIST)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getRadiologist")
    public ResponseEntity<Page<DoctorsResponseDTO>> getRadiologist(
            @RequestParam(required = false) String availabilityStatus,
            Pageable pageable
    ){
       return ResponseEntity.ok(doctorService.getRadiologist(availabilityStatus, pageable));
    }

    //READ & FILTER (PHYSICAL THERAPIST)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getTherapist")
    public ResponseEntity<Page<DoctorsResponseDTO>> getTherapist(
            @RequestParam(required = false) String availabilityStatus,
            Pageable pageable
    ){
        return ResponseEntity.ok(doctorService.getTherapist(availabilityStatus, pageable));
    }

    //SEARCH
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("searchDoctor/{searchName}")
    public ResponseEntity<Page<DoctorsResponseDTO>> searchDoctor(@PathVariable String searchName, Pageable pageable){
       return ResponseEntity.ok(doctorService.searchDoctor(searchName, pageable));
    }

    //DROPDOWN (ALL DOCTORS)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("doctorDropdown")
    public ResponseEntity<List<DoctorsResponseDTO>> doctorDropdown(){
       return ResponseEntity.ok(doctorService.doctorDropdown());
    }

    //DROPDOWN (PHYSICAL THERAPIST)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("therapistDropdown")
    public ResponseEntity<List<DoctorsResponseDTO>> ptDropdown(){
       return ResponseEntity.ok(doctorService.ptDropdown());
    }

    //DROPDOWN (PHYSICAL THERAPIST)
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("radiologistDropdown")
    public ResponseEntity<List<DoctorsResponseDTO>> radiologistDropdown(){
        return ResponseEntity.ok(doctorService.radiologistDropdown());
    }

    //UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("updateDoctor/{doctorId}")
    public ResponseEntity<SuccessResponse> updateDoctor(
            @PathVariable int doctorId,
            @RequestBody Doctors doctor){
       doctorService.updateDoctor(doctorId, doctor);
       return ResponseEntity.ok().body(new SuccessResponse(200, "Doctor Updated"));
    }

    // MARK AS ON LEAVE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("leaveDoctor/{doctorId}")
    public ResponseEntity<SuccessResponse> markLeave(@PathVariable int doctorId){
       doctorService.markLeave(doctorId);
       return ResponseEntity.ok().body(new SuccessResponse(200, "Marked as On Leave"));
    }

    //MARK AS UNAVAILABLE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("unavailableDoctor/{doctorId}")
    public ResponseEntity<SuccessResponse> markUnavailable(@PathVariable int doctorId){
       doctorService.markUnavailable(doctorId);
       return ResponseEntity.ok().body(new SuccessResponse(200, "Marked as Unavailable"));
    }

    //MARK AS AVAILABLE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("availableDoctor/{doctorId}")
    public ResponseEntity<SuccessResponse> markAvailable(@PathVariable int doctorId){
       doctorService.markAvailable(doctorId);
       return ResponseEntity.ok().body(new SuccessResponse(200, "Marked as Available"));
    }
}