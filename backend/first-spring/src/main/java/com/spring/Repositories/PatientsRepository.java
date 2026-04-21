package com.spring.Repositories;

import com.spring.Models.Patients;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PatientsRepository extends JpaRepository<Patients, Integer> {

}
