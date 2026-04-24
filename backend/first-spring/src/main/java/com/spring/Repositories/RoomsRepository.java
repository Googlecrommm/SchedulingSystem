package com.spring.Repositories;

import com.spring.Enums.SoftDelete;
import com.spring.Models.Rooms;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;

public interface RoomsRepository extends JpaRepository<Rooms, Integer>, JpaSpecificationExecutor<Rooms> {
    boolean existsByRoomName(String name);

    Page<Rooms> findAll(Pageable pageable);
    Page<Rooms> searchByRoomNameContaining(String roomName, Pageable pageable);
    List<Rooms> findAllByRoomStatusNot(SoftDelete roomStatus);
}
