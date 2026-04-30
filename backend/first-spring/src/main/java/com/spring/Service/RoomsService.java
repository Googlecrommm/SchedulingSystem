package com.spring.Service;

import com.spring.Enums.MachineStatus;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotAllowed;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Rooms;
import com.spring.Models.Users;
import com.spring.Repositories.DepartmentsRepository;
import com.spring.Repositories.RoomsRepository;
import com.spring.Specifications.RoomSpecification;
import com.spring.dto.RoomResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RoomsService {
    private final RoomsRepository roomsRepository;
    private final ModelMapper modelMapper;
    private final DepartmentsRepository departmentsRepository;

    public RoomsService(RoomsRepository roomsRepository, ModelMapper modelMapper,
                        DepartmentsRepository departmentsRepository) {
        this.roomsRepository = roomsRepository;
        this.modelMapper = modelMapper;
        this.departmentsRepository = departmentsRepository;
    }

    // ─── Admin bypasses department check; frontdesk is scoped to their department ─
    private void validateRoomBelongsToDepartment(Rooms room, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        if (isAdmin) return;

        Users user = (Users) authentication.getPrincipal();

        if (user.getRole() == null || user.getRole().getDepartment() == null) {
            throw new NotAllowed("You are not assigned to any department.");
        }

        String userDept = user.getRole().getDepartment().getDepartmentName();
        String roomDept = room.getDepartment().getDepartmentName();

        if (!userDept.equalsIgnoreCase(roomDept)) {
            throw new NotAllowed(
                    "You can only manage rooms within your department (" + userDept + ")."
            );
        }
    }

    // ─── Reusable DTO mapping helper ────────────────────────────────────────────
    private RoomResponseDTO mapToDTO(Rooms rooms) {
        RoomResponseDTO roomDTO = modelMapper.map(rooms, RoomResponseDTO.class);
        roomDTO.setDepartmentName(rooms.getDepartment().getDepartmentName());
        return roomDTO;
    }

    //CREATE — admin and frontdesk, frontdesk scoped to their department
    public void createRoom(Rooms room, Authentication authentication) {
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (isAdmin) {
            // Admin must explicitly provide the department
            if (room.getDepartment() == null || room.getDepartment().getDepartmentId() == 0) {
                throw new NotAllowed("Department is required.");
            }
        } else {
            // Frontdesk: auto-assign their own department, ignore whatever was sent
            Users user = (Users) authentication.getPrincipal();

            if (user.getRole() == null || user.getRole().getDepartment() == null) {
                throw new NotAllowed("You are not assigned to any department.");
            }

            room.setDepartment(user.getRole().getDepartment());
        }

        if (roomsRepository.existsByRoomNameIgnoreCaseAndDepartment_DepartmentId(
                room.getRoomName(), room.getDepartment().getDepartmentId())) {
            throw new AlreadyExists("Room already exists in this department.");
        }

        roomsRepository.save(room);
    }

    //READ & FILTER
    public Page<RoomResponseDTO> getRooms(MachineStatus roomStatus, String departmentName, Pageable pageable) {
        Specification<Rooms> filters = Specification
                .where(RoomSpecification.hasStatus(roomStatus))
                .and(RoomSpecification.hasDepartment(departmentName));

        return roomsRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //SEARCH
    public Page<RoomResponseDTO> searchRoom(String roomName, String departmentName, Pageable pageable) {
        Specification<Rooms> filters = Specification
                .where(RoomSpecification.hasDepartment(departmentName))
                .and((root, query, cb) ->
                        cb.like(cb.lower(root.get("roomName")),
                                "%" + roomName.toLowerCase() + "%"));

        return roomsRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //DROPDOWN
    public List<RoomResponseDTO> roomsDropdown(String departmentName) {
        if (departmentName == null) {
            return roomsRepository.findAllByRoomStatusNot(MachineStatus.Under_Maintenance)
                    .stream()
                    .map(this::mapToDTO)
                    .toList();
        }
        return roomsRepository
                .findAllByRoomStatusNotAndDepartment_DepartmentNameIgnoreCase(
                        MachineStatus.Under_Maintenance, departmentName)
                .stream()
                .map(this::mapToDTO)
                .toList();
    }

    //UPDATE — admin and frontdesk, frontdesk scoped to their department
    public void updateRoom(int roomId, Rooms room, Authentication authentication) {
        Rooms roomToUpdate = roomsRepository.findById(roomId)
                .orElseThrow(() -> new NotFound("Room not found"));

        validateRoomBelongsToDepartment(roomToUpdate, authentication);

        if (room.getRoomName() != null && !room.getRoomName().isEmpty()) {
            // Check duplicate against the existing room's department (department never changes on update)
            if (roomsRepository.existsByRoomNameIgnoreCaseAndDepartment_DepartmentIdAndRoomIdNot(
                    room.getRoomName(), roomToUpdate.getDepartment().getDepartmentId(), roomId)) {
                throw new AlreadyExists("Room already exists in this department.");
            }
            roomToUpdate.setRoomName(room.getRoomName());
        }

        roomsRepository.save(roomToUpdate);
    }

    //ARCHIVE — admin and frontdesk, frontdesk scoped to their department
    public void archiveRoom(int roomId, Authentication authentication) {
        Rooms roomToArchive = roomsRepository.findById(roomId)
                .orElseThrow(() -> new NotFound("Room not found"));

        validateRoomBelongsToDepartment(roomToArchive, authentication);

        if (roomToArchive.getRoomStatus().equals(MachineStatus.Archived)) {
            throw new NoChangesDetected("Room is already archived");
        }

        roomToArchive.setRoomStatus(MachineStatus.Archived);
        roomsRepository.save(roomToArchive);
    }

    //MARK AS MAINTENANCE
    public void markAsMaintenance(int roomId, Authentication authentication){
        Rooms roomToMaintenance = roomsRepository.findById(roomId)
                .orElseThrow(() -> new NotFound("Room not found"));

        validateRoomBelongsToDepartment(roomToMaintenance, authentication);

        if (roomToMaintenance.getRoomStatus().equals(MachineStatus.Under_Maintenance)){
            throw new NoChangesDetected("Room is already under maintenance");
        }

        roomToMaintenance.setRoomStatus(MachineStatus.Under_Maintenance);
        roomsRepository.save(roomToMaintenance);
    }

    //RESTORE — admin and frontdesk, frontdesk scoped to their department
    public void restoreRoom(int roomId, Authentication authentication) {
        Rooms roomToRestore = roomsRepository.findById(roomId)
                .orElseThrow(() -> new NotFound("Room not found"));

        validateRoomBelongsToDepartment(roomToRestore, authentication);

        if (roomToRestore.getRoomStatus().equals(MachineStatus.Available)) {
            throw new NoChangesDetected("Room is already available");
        }

        roomToRestore.setRoomStatus(MachineStatus.Available);
        roomsRepository.save(roomToRestore);
    }
}