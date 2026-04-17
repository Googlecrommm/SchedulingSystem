package com.spring.Repositories;

import com.spring.Models.Machines;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface MachinesRepository extends JpaRepository<Machines, Integer>, JpaSpecificationExecutor<Machines> {
    boolean existsByMachineName(String machineName);

    Page<Machines> findAll(Pageable pageable);
}
