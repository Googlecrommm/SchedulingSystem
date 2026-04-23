package com.spring.Repositories;

import com.spring.Models.Patients;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientsRepository extends JpaRepository<Patients, Integer>, JpaSpecificationExecutor<Patients> {
    boolean existsByName(String name);
    boolean existsByContactNumber(String contactNumber);
    Optional<Patients> findByContactNumber(String contactNumber);
    Page<Patients> findAll(Pageable pageable);
    Page<Patients> searchByNameContaining(String name, Pageable pageable);
    List<Patients> searchByNameContaining(String name);
}
