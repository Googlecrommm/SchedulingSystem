package com.spring.Repositories;

import com.spring.Enums.SoftDelete;
import com.spring.Models.Roles;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RolesRepository extends JpaRepository<Roles, Integer>, JpaSpecificationExecutor<Roles> {
    boolean existsByRoleName(String roleName);

    @Query("select role from Roles role where role.roleName like %:searchName%")
    Page<Roles> searchRoleByName(@Param("searchName") String searchName, Pageable pageable);

    Page<Roles> findAll(Pageable pageable);

    List<Roles> findAllByRoleStatusNotAndRoleNameNot(SoftDelete roleStatus, String roleName);
}
