package com.spring.Repositories;

import com.spring.Models.Departments;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DepartmentsRepository extends JpaRepository<Departments, Integer> {

    boolean existsByDepartmentName(String departmentName);
    Departments findByDepartmentId(int departmentId, Departments department);
}
