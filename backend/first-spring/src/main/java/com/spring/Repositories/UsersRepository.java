package com.spring.Repositories;

import com.spring.Models.Users;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsersRepository extends JpaRepository<Users, Integer> {
    boolean existsByEmail(String email);
}
