package com.spring.Repositories;

import com.spring.Enums.DoctorStatus;
import com.spring.Models.Doctors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface DoctorsRepository extends JpaRepository<Doctors, Integer>, JpaSpecificationExecutor<Doctors> {
    boolean existsByName(String name);

    Page<Doctors> findAll(Pageable pageable);

    Page<Doctors> searchByNameContaining(String searchName, Pageable pageable);

    List<Doctors> findAllByAvailabilityStatusEquals(DoctorStatus availabilityStatus);

    List<Doctors> findAllByAvailabilityStatusEqualsAndRole_RoleNameEqualsIgnoreCase(DoctorStatus availabilityStatus, String roleName);
}
