package com.spring.Controller;

import com.spring.Enums.SoftDelete;
import com.spring.Models.HospitalizationPlan;
import com.spring.Service.HospitalizationPlanService;
import com.spring.dto.HospitalizationPlanResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class HospitalizationPlanController {
    private final HospitalizationPlanService planService;

    public HospitalizationPlanController(HospitalizationPlanService planService){
        this.planService = planService;
    }

    //CREATE
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("createPlan")
    public ResponseEntity<SuccessResponse> createPlan(@RequestBody HospitalizationPlan plan){

        planService.createPlan(plan);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Hospitalization Plan added"));
    }

    //READ & FILTER
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getPlans")
    public ResponseEntity<Page<HospitalizationPlanResponseDTO>> getPlans(
            @RequestParam(required = false) SoftDelete planStatus,
            Pageable pageable){

        return ResponseEntity.ok(planService.getPlans(planStatus, pageable));
    }

    //SEARCH
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("searchPlans/{companyName}")
    public ResponseEntity<Page<HospitalizationPlanResponseDTO>> searchPlan(
            @PathVariable String companyName,
            Pageable pageable
    ){

        return ResponseEntity.ok(planService.searchPlans(companyName, pageable));
    }

    //DROPDOWN
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("plansDropdown")
    public ResponseEntity<List<HospitalizationPlanResponseDTO>> plansDropdown(){
        return ResponseEntity.ok(planService.plansDropdown());
    }

    //UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("updatePlan/{planId}")
    public ResponseEntity<SuccessResponse> updatePlan(
            @PathVariable int planId,
            @RequestBody HospitalizationPlan plan){

        planService.updatePlan(planId, plan);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Plan updated"));
    }

    //ARCHIVE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("archivePlan/{planId}")
    public ResponseEntity<SuccessResponse> archivePlan(@PathVariable int planId){

        planService.archivePlan(planId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Plan archived"));
    }

    //RESTORE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("restorePlan/{planId}")
    public ResponseEntity<SuccessResponse> restorePlan(@PathVariable int planId){

        planService.restorePlan(planId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Plan restored"));
    }
}
