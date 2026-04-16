package com.spring.Repositories;

import com.spring.Models.Machines;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MachinesRepository extends JpaRepository<Machines, Integer> {
    boolean existsByMachineName(String machineName);
}
