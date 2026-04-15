package com.spring.Repositories;

import com.spring.Models.Roles;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RolesRepository extends JpaRepository<Roles, Integer> {
    boolean existsByRoleName(String roleName);

    @Query("select role from Roles role where role.roleName like %:searchName%")
    List<Roles> searchRoleByName(@Param("searchName") String searchName);
}
