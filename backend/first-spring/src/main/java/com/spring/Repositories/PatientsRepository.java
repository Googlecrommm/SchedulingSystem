package com.spring.Repositories;

import com.spring.Enums.PatientStatus;
import com.spring.Models.Patients;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PatientsRepository extends JpaRepository<Patients, Integer>, JpaSpecificationExecutor<Patients> {
    boolean existsByFirstNameAndLastNameAndPatientIdNot(String firstName, String lastName, int patientId);
    boolean existsByContactNumber(String contactNumber);
    boolean existsByContactNumberAndPatientIdNot(String contactNumber, int patientId);
    Optional<Patients> findByContactNumber(String contactNumber);
    Page<Patients> findAll(Pageable pageable);
    Page<Patients> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName, Pageable pageable);

    @Query("SELECT p FROM Patients p WHERE (LOWER(p.firstName) LIKE LOWER(CONCAT('%', :name, '%')) OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :name, '%'))) AND p.status != :status")
    List<Patients> findByNameContainingAndStatusNot(@Param("name") String name, @Param("status") PatientStatus status);
}
