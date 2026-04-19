package com.spring.Repositories;

import com.spring.Enums.SoftDelete;
import com.spring.Models.Modalities;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ModalitiesRepository extends JpaRepository<Modalities, Integer>, JpaSpecificationExecutor<Modalities> {
    boolean existsByModalityName(String modalityName);

    Page<Modalities> findAll(Pageable pageable);

    Page<Modalities> searchByModalityNameContaining(String searchModality, Pageable pageable);

    List<Modalities> findAllByModalityStatusNot(SoftDelete modalityStatus);
}
