package com.spring.Controller;

import com.spring.Enums.SoftDelete;
import com.spring.Models.HospitalizationType;
import com.spring.Service.HospitalizationTypeService;
import com.spring.dto.HospitalizationTypeResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class HospitalizationTypeController {
    private final HospitalizationTypeService typeService;

    public HospitalizationTypeController(HospitalizationTypeService typeService){
        this.typeService = typeService;
    }

    //CREATE
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("createType")
    public ResponseEntity<SuccessResponse> createType(@RequestBody HospitalizationType type){
        typeService.createType(type);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Hospitalization Type added"));
    }

    //READ & FILTER
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getTypes")
    public ResponseEntity<Page<HospitalizationTypeResponseDTO>> getTypes(
            @RequestParam(required = false) SoftDelete typeStatus,
            Pageable pageable
            ){

        return ResponseEntity.ok(typeService.getTypes(typeStatus, pageable));
    }

    //SEARCH
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("searchTypes/{typeName}")
    public ResponseEntity<Page<HospitalizationTypeResponseDTO>> searchTypes(
            @PathVariable(required = false) String typeName,
            Pageable pageable
    ){

        return ResponseEntity.ok(typeService.searchTypes(typeName, pageable));
    }

    //DROPDOWN
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("typesDropdown")
    public ResponseEntity<List<HospitalizationTypeResponseDTO>> typesDropdown(){
        return ResponseEntity.ok(typeService.typeDropdown());
    }

    //UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("updateType/{typeId}")
    public ResponseEntity<SuccessResponse> updateTypes(
            @PathVariable int typeId,
            @RequestBody HospitalizationType type
    ){

        typeService.updateType(typeId, type);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Type updated"));
    }

    //ARCHIVE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("archiveType/{typeId}")
    public ResponseEntity<SuccessResponse> archiveType(
            @PathVariable int typeId
    ){
        typeService.archiveType(typeId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Type archived"));
    }

    //RESTORE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("restoreType/{typeId}")
    public ResponseEntity<SuccessResponse> restoreType(
            @PathVariable int typeId
    ){

        typeService.restoreType(typeId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Type restored"));
    }

}
