package com.spring.Repositories;

import com.spring.Enums.SoftDelete;
import com.spring.Models.HospitalizationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HospitalizationTypeRepository extends
        JpaRepository<HospitalizationType, Integer>,
        JpaSpecificationExecutor<HospitalizationType> {

    boolean existsByTypeName(String typeName);
    Page<HospitalizationType> findAll(Pageable pageable);
    Page<HospitalizationType> searchByTypeNameContaining(String typeName, Pageable pageable);
    List<HospitalizationType> findAllByTypeStatusNot(SoftDelete statusType);

}
