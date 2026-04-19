package com.spring.Repositories;

import com.spring.Models.Modalities;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface ModalitiesRepository extends JpaRepository<Modalities, Integer>, JpaSpecificationExecutor<Modalities> {
    boolean existsByModality(String modality);
}
