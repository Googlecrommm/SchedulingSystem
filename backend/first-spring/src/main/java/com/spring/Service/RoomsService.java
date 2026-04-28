package com.spring.Service;

import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Rooms;
import com.spring.Repositories.DepartmentsRepository;
import com.spring.Repositories.RoomsRepository;
import com.spring.Specifications.RoomSpecification;
import com.spring.dto.RoomResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomsService {
    private final RoomsRepository roomsRepository;
    private final ModelMapper modelMapper;
    private final DepartmentsRepository departmentsRepository;

    public RoomsService(RoomsRepository roomsRepository, ModelMapper modelMapper, DepartmentsRepository departmentsRepository) {
        this.roomsRepository = roomsRepository;
        this.modelMapper = modelMapper;
        this.departmentsRepository = departmentsRepository;
    }

    // ─── Reusable DTO mapping helper ────────────────────────────────────────────
    private RoomResponseDTO mapToDTO(Rooms rooms) {
        RoomResponseDTO roomDTO = modelMapper.map(rooms, RoomResponseDTO.class);
        roomDTO.setDepartmentName(rooms.getDepartment().getDepartmentName());
        return roomDTO;
    }

    //CREATE — admin only
    public void createRoom(Rooms room) {
        if (roomsRepository.existsByRoomName(room.getRoomName())) {
            throw new AlreadyExists("Room already exists");
        }
        roomsRepository.save(room);
    }

    //READ & FILTER — departmentName null = admin sees all, non-null = scoped
    public Page<RoomResponseDTO> getRooms(SoftDelete roomStatus, String departmentName, Pageable pageable) {
        Specification<Rooms> filters = Specification
                .where(RoomSpecification.hasStatus(roomStatus))
                .and(RoomSpecification.hasDepartment(departmentName));

        return roomsRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //SEARCH — scoped by department for non-admins
    public Page<RoomResponseDTO> searchRoom(String roomName, String departmentName, Pageable pageable) {
        Specification<Rooms> filters = Specification
                .where(RoomSpecification.hasDepartment(departmentName)) // ADDED
                .and((root, query, cb) ->
                        cb.like(cb.lower(root.get("roomName")),
                                "%" + roomName.toLowerCase() + "%"));

        return roomsRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //DROPDOWN — admin gets all, department user gets only their department
    public List<RoomResponseDTO> roomsDropdown(String departmentName) {
        if (departmentName == null) {
            // Admin — all active rooms across all departments
            return roomsRepository.findAllByRoomStatusNot(SoftDelete.Archived)
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }
        // Department user — only active rooms in their department
        return roomsRepository
                .findAllByRoomStatusNotAndDepartment_DepartmentNameIgnoreCase(
                        SoftDelete.Archived, departmentName)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    //UPDATE — admin only
    public void updateRoom(int roomId, Rooms room) {
        Rooms roomToUpdate = roomsRepository.findById(roomId)
                .orElseThrow(() -> new NotFound("Room not found"));

        if (roomsRepository.existsByRoomName(room.getRoomName())) {
            throw new AlreadyExists("Room already exists");
        }

        if (room.getRoomName() != null && !room.getRoomName().isEmpty()) {
            roomToUpdate.setRoomName(room.getRoomName());
        }

        roomToUpdate.setDepartment(roomToUpdate.getDepartment());
        roomToUpdate.setRoomStatus(roomToUpdate.getRoomStatus());
        roomsRepository.save(roomToUpdate);
    }

    //ARCHIVE — admin only
    public void archiveRoom(int roomId) {
        Rooms roomToArchive = roomsRepository.findById(roomId)
                .orElseThrow(() -> new NotFound("Room not found"));

        if (roomToArchive.getRoomStatus().equals(SoftDelete.Archived)) {
            throw new NoChangesDetected("Room is already archived");
        }

        roomToArchive.setRoomStatus(SoftDelete.Archived);
        roomsRepository.save(roomToArchive);
    }

    //RESTORE — admin only
    public void restoreRoom(int roomId) {
        Rooms roomToRestore = roomsRepository.findById(roomId)
                .orElseThrow(() -> new NotFound("Room not found"));

        if (roomToRestore.getRoomStatus().equals(SoftDelete.Active)) {
            throw new NoChangesDetected("Room is already active");
        }

        roomToRestore.setRoomStatus(SoftDelete.Active);
        roomsRepository.save(roomToRestore);
    }
}