package com.spring.Controller;

import com.spring.Models.Modalities;
import com.spring.Service.ModalitiesService;
import com.spring.dto.ModalityResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ModalitiesController {
    private final ModalitiesService modalitiesService;

    public ModalitiesController(ModalitiesService modalitiesService){
        this.modalitiesService = modalitiesService;
    }

    //CREATE
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("createModality")
    public ResponseEntity<Modalities> createModality(@RequestBody Modalities modality){
        return ResponseEntity.ok(modalitiesService.createModality(modality));
    }

    //READ ALL
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getModalities")
    public ResponseEntity<Page<ModalityResponseDTO>> getModalities(
            @RequestParam(required = false) String modalityStatus,
            @RequestParam(required = false) String departmentName,
            Pageable pageable){
        return ResponseEntity.ok(modalitiesService.getModalities(modalityStatus, departmentName, pageable));
    }

    //SEARCH MODALITY
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("searchModality/{searchModality}")
    public ResponseEntity<Page<ModalityResponseDTO>> searchModality(
            @PathVariable String searchModality,
            Pageable pageable
    ){
        return ResponseEntity.ok(modalitiesService.searchModality(searchModality, pageable));
    }

    //MODALITY DROPDOWN
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("modalityDropdown")
    public ResponseEntity<List<ModalityResponseDTO>> modalityDropdown(){
        return ResponseEntity.ok(modalitiesService.modalityDropdown());
    }

    //UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("updateModality/{modalityId}")
    public ResponseEntity<SuccessResponse> updateModality(
            @PathVariable int modalityId,
            @RequestBody Modalities modality){
        modalitiesService.updateModality(modalityId, modality);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Modality Updated"));
    }

    //ARCHIVE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("archiveModality/{modalityId}")
    public ResponseEntity<SuccessResponse> archiveModality(@PathVariable int modalityId){
        modalitiesService.archiveModality(modalityId);
        return ResponseEntity.ok().body(new SuccessResponse(200,"Modality Updated"));
    }

    //RESTORE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("restoreModality/{modalityId}")
    public ResponseEntity<SuccessResponse> restoreModality(@PathVariable int modalityId){
        modalitiesService.restoreModality(modalityId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Modality Update"));
    }
}
