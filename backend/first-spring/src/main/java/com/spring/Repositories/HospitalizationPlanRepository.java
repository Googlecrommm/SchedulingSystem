package com.spring.Repositories;

import com.spring.Enums.SoftDelete;
import com.spring.Models.HospitalizationPlan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalizationPlanRepository extends
        JpaRepository<HospitalizationPlan, Integer>,
        JpaSpecificationExecutor<HospitalizationPlan> {

    Boolean existsByCompanyName(String companyName);
    Page<HospitalizationPlan> findAll(Pageable pageable);
    Page<HospitalizationPlan> searchByCompanyNameContaining(String companyName, Pageable pageable);
    List<HospitalizationPlan> findAllByPlanStatusNot(SoftDelete planStatus);
}
