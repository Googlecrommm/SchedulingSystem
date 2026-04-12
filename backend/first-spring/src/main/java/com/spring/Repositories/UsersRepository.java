package com.spring.Repositories;

import com.spring.Models.Users;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsersRepository extends JpaRepository<Users, Integer> {
    boolean existsByEmail(String email);


    Optional<Users> findByEmail(String email);

    Optional<Users> findById(int userId);
}
