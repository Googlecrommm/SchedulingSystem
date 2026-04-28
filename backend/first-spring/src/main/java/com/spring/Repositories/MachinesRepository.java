package com.spring.Repositories;

import com.spring.Enums.MachineStatus;
import com.spring.Models.Machines;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MachinesRepository extends JpaRepository<Machines, Integer>, JpaSpecificationExecutor<Machines> {
    boolean existsByMachineName(String machineName);

    Page<Machines> findAll(Pageable pageable);

    Page<Machines> searchByMachineNameContaining(String machineName, Pageable pageable);

    List<Machines> findAllByMachineStatus(MachineStatus machineStatus);

    // ADDED — for department-scoped dropdown (non-admin users)
    List<Machines> findAllByMachineStatusAndModality_Department_DepartmentNameIgnoreCase(
            MachineStatus machineStatus, String departmentName);
}