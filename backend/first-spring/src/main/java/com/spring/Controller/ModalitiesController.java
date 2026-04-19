package com.spring.Controller;

import com.spring.Models.Modalities;
import com.spring.Service.ModalitiesService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
