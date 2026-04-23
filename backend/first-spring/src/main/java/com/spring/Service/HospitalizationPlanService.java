package com.spring.Service;

import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotAllowed;
import com.spring.Exceptions.NotFound;
import com.spring.Models.HospitalizationPlan;
import com.spring.Repositories.HospitalizationPlanRepository;
import com.spring.Specifications.HospitalizationPlanSpecification;
import com.spring.dto.HospitalizationPlanResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HospitalizationPlanService {
    private final HospitalizationPlanRepository planRepository;
    private final ModelMapper modelMapper;

    public HospitalizationPlanService(HospitalizationPlanRepository planRepository, ModelMapper modelMapper){
        this.planRepository = planRepository;
        this.modelMapper = modelMapper;
    }

    //CREATE
    public void createPlan(HospitalizationPlan plan){
        if (planRepository.existsByCompanyName(plan.getCompanyName())){
            throw new AlreadyExists("Company Already Exists");
        }
        planRepository.save(plan);
    }

    //READ & FILTER
    public Page<HospitalizationPlanResponseDTO> getPlans(SoftDelete planStatus, Pageable pageable){
        Specification<HospitalizationPlan> filters = Specification
                .where(HospitalizationPlanSpecification.hasStatus(planStatus));


        return planRepository.findAll(filters, pageable)
                .map(hospitalizationPlan -> {
                    return modelMapper.map(hospitalizationPlan, HospitalizationPlanResponseDTO.class);
                });
    }

    //SEARCH
    public Page<HospitalizationPlanResponseDTO> searchPlans(String companyName, Pageable pageable){
        return planRepository.searchByCompanyNameContaining(companyName, pageable)
                .map(hospitalizationPlan -> {
                    return modelMapper.map(hospitalizationPlan, HospitalizationPlanResponseDTO.class);
                });
    }


    //DROPDOWN
    public List<HospitalizationPlanResponseDTO> plansDropdown(){
        return planRepository.findAllByPlanStatusNot(SoftDelete.Archived)
                .stream()
                .map(hospitalizationPlan -> {
                    return modelMapper.map(hospitalizationPlan, HospitalizationPlanResponseDTO.class);
                })
                .toList();
    }

    //UPDATE
    public void updatePlan(int planId, HospitalizationPlan plan){
        HospitalizationPlan planToUpdate = planRepository.findById(planId).orElseThrow(() -> new NotFound("Plan not found"));

        if (planRepository.existsByCompanyName(plan.getCompanyName())){
            throw new AlreadyExists("Company already exists");
        }

        if (plan.getCode() != null && !plan.getCode().isEmpty()){
            planToUpdate.setCode(plan.getCode());
        }

        if (plan.getCompanyName() != null && !plan.getCompanyName().isEmpty()){
            planToUpdate.setCompanyName(plan.getCompanyName());
        }

        planToUpdate.setPlanStatus(planToUpdate.getPlanStatus());

        planRepository.save(planToUpdate);
    }

    //ARCHIVE
    public void archivePlan(int planId){
        HospitalizationPlan planToArchive = planRepository.findById(planId).orElseThrow(() -> new NotFound("Plan not found"));

        if (planToArchive.getPlanStatus().equals(SoftDelete.Archived)){
            throw new NoChangesDetected("Plan is already archived");
        }

        planToArchive.setPlanStatus(SoftDelete.Archived);
        planRepository.save(planToArchive);
    }

    //RESTORE
    public void restorePlan(int planId){
        HospitalizationPlan planToRestore = planRepository.findById(planId).orElseThrow(() -> new NotFound("Plan not found"));

        if (planToRestore.getPlanStatus().equals(SoftDelete.Active)){
            throw new NoChangesDetected("Plan is already active");
        }

        planToRestore.setPlanStatus(SoftDelete.Active);
        planRepository.save(planToRestore);
    }
}
