package com.spring.Repositories;

import com.spring.Enums.MachineStatus;
import com.spring.Enums.SoftDelete;
import com.spring.Models.Rooms;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RoomsRepository extends JpaRepository<Rooms, Integer>, JpaSpecificationExecutor<Rooms> {
    boolean existsByRoomNameIgnoreCaseAndDepartment_DepartmentId(String roomName, int departmentId);

    boolean existsByRoomNameIgnoreCaseAndDepartment_DepartmentIdAndRoomIdNot(
            String roomName, int departmentId, int roomId);

    Page<Rooms> findAll(Pageable pageable);

    Page<Rooms> searchByRoomNameContaining(String roomName, Pageable pageable);

    List<Rooms> findAllByRoomStatusNot(MachineStatus roomStatus);

    // ADDED — for department-scoped dropdown (non-admin users)
    List<Rooms> findAllByRoomStatusNotAndDepartment_DepartmentNameIgnoreCase(
            MachineStatus roomStatus, String departmentName);
}