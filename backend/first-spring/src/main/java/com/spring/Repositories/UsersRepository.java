package com.spring.Repositories;

import com.spring.Models.Users;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UsersRepository extends JpaRepository<Users, Integer>, JpaSpecificationExecutor<Users> {
    boolean existsByEmail(String email);

    Optional<Users> findByEmail(String email);
    Optional<Users> findById(int userId);
    Page<Users> findAll(Pageable pageable);
    Page<Users> findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String firstName, String lastName, Pageable pageable);
}
