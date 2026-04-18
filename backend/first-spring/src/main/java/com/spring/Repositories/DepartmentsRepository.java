package com.spring.Repositories;

import com.spring.Models.Departments;
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
public interface DepartmentsRepository extends JpaRepository<Departments, Integer>, JpaSpecificationExecutor<Departments> {

    boolean existsByDepartmentName(String departmentName);

    Departments findByDepartmentId(int departmentId, Departments department);

    Optional<Departments> findByDepartmentName(String departmentName);

    Page<Departments> findAll(Pageable pageable);

    @Query("SELECT department from Departments department WHERE department.departmentName LIKE %:searchDept%")
    Page<Departments> searchByDepartmentName(@Param("searchDept") String searchDept, Pageable pageable);
}
