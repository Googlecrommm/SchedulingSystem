package com.spring.Repositories;

import com.spring.Models.Logs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface LogsRepository extends JpaRepository<Logs, Integer>, JpaSpecificationExecutor<Logs> {
    Page<Logs> findAll(Pageable pageable);
}
