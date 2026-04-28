package com.spring.Controller;

import com.spring.Models.Modalities;
import com.spring.Security.DepartmentSecurityHelper;
import com.spring.Service.ModalitiesService;
import com.spring.dto.ModalityResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ModalitiesController {
    private final ModalitiesService modalitiesService;
    private final DepartmentSecurityHelper departmentSecurityHelper;

    public ModalitiesController(ModalitiesService modalitiesService, DepartmentSecurityHelper departmentSecurityHelper) {
        this.modalitiesService = modalitiesService;
        this.departmentSecurityHelper = departmentSecurityHelper;
    }

    //CREATE — admin provides department, frontdesk auto-assigned
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    @PostMapping("createModality")
    public ResponseEntity<Modalities> createModality(
            @RequestBody Modalities modality,
            Authentication authentication) {
        return ResponseEntity.ok(modalitiesService.createModality(modality, authentication));
    }

    //READ & FILTER — all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("getModalities")
    public ResponseEntity<Page<ModalityResponseDTO>> getModalities(
            @RequestParam(required = false) String modalityStatus,
            @RequestParam(required = false) String departmentName,
            Pageable pageable,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(departmentName, authentication);

        return ResponseEntity.ok(
                modalitiesService.getModalities(modalityStatus, effectiveDept, pageable));
    }

    //SEARCH — all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("searchModality/{searchModality}")
    public ResponseEntity<Page<ModalityResponseDTO>> searchModality(
            @PathVariable String searchModality,
            Pageable pageable,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(null, authentication);

        return ResponseEntity.ok(
                modalitiesService.searchModality(searchModality, effectiveDept, pageable));
    }

    //DROPDOWN — all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("modalityDropdown")
    public ResponseEntity<List<ModalityResponseDTO>> modalityDropdown(Authentication authentication) {
        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(null, authentication);

        return ResponseEntity.ok(modalitiesService.modalityDropdown(effectiveDept));
    }

    //UPDATE
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    @PutMapping("updateModality/{modalityId}")
    public ResponseEntity<SuccessResponse> updateModality(
            @PathVariable int modalityId,
            @RequestBody Modalities modality,
            Authentication authentication) {
        modalitiesService.updateModality(modalityId, modality, authentication);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Modality Updated"));
    }

    //ARCHIVE
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    @PutMapping("archiveModality/{modalityId}")
    public ResponseEntity<SuccessResponse> archiveModality(
            @PathVariable int modalityId,
            Authentication authentication) {
        modalitiesService.archiveModality(modalityId, authentication);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Modality Archived"));
    }

    //RESTORE
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    @PutMapping("restoreModality/{modalityId}")
    public ResponseEntity<SuccessResponse> restoreModality(
            @PathVariable int modalityId,
            Authentication authentication) {
        modalitiesService.restoreModality(modalityId, authentication);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Modality Restored"));
    }
}