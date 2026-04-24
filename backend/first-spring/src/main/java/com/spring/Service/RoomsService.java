package com.spring.Service;

import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotAllowed;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Departments;
import com.spring.Models.Roles;
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

    //CREATE
    public void createRoom(Rooms room){
        Departments defaultDepartment = departmentsRepository.findById(3).orElseThrow(() -> new NotFound("Department not found"));
        if (roomsRepository.existsByRoomName(room.getRoomName())){
            throw new AlreadyExists("Room already exists");
        }
        room.setDepartment(defaultDepartment);
        roomsRepository.save(room);
    }

    //READ AND FILTER
    public Page<RoomResponseDTO> getRooms(SoftDelete roomStatus, String departmentName, Pageable pageable){
        Specification<Rooms> filters = Specification
                .where(RoomSpecification.hasStatus(roomStatus))
                .and(RoomSpecification.hasDepartment(departmentName));

        return roomsRepository.findAll(filters, pageable)
                .map(rooms -> {
                    RoomResponseDTO roomDTO = modelMapper.map(rooms, RoomResponseDTO.class);
                    roomDTO.setDepartmentName(rooms.getDepartment().getDepartmentName());
                    return roomDTO;
                });
    }

    //SEARCH
    public Page<RoomResponseDTO> searchRoom(String roomName, Pageable pageable){
        return roomsRepository.searchByRoomNameContaining(roomName, pageable)
                .map(rooms -> {
                    RoomResponseDTO roomDTO = modelMapper.map(rooms, RoomResponseDTO.class);
                    roomDTO.setDepartmentName(rooms.getDepartment().getDepartmentName());
                    return roomDTO;
                });
    }

    //DROPDOWN
    public List<RoomResponseDTO> roomsDropdown(){
        return roomsRepository.findAllByRoomStatusNot(SoftDelete.Archived)
                .stream()
                .map(rooms -> {
                    RoomResponseDTO roomDTO = modelMapper.map(rooms, RoomResponseDTO.class);
                    roomDTO.setDepartmentName(rooms.getDepartment().getDepartmentName());
                    return roomDTO;
                })
                .toList();
    }

    //UPDATE
    public void updateRoom(int roomId, Rooms room){
        Rooms roomToUpdate = roomsRepository.findById(roomId).orElseThrow(() -> new NotFound("Room not found"));

        if (roomsRepository.existsByRoomName(room.getRoomName())){
            throw new AlreadyExists("Room already exists");
        }

        if (room.getRoomName() != null && !room.getRoomName().isEmpty()){
            roomToUpdate.setRoomName(room.getRoomName());
        }

        roomToUpdate.setDepartment(roomToUpdate.getDepartment());
        roomToUpdate.setRoomStatus(roomToUpdate.getRoomStatus());
        roomsRepository.save(roomToUpdate);
    }

    //ARCHIVE
    public void archiveRoom(int roomId){
        Rooms roomToArchive = roomsRepository.findById(roomId).orElseThrow(() -> new NotFound("Room not found"));

        if (roomToArchive.getRoomStatus().equals(SoftDelete.Archived)){
            throw new NoChangesDetected("Room is already archived");
        }

        roomToArchive.setRoomStatus(SoftDelete.Archived);
        roomsRepository.save(roomToArchive);
    }

    //RESTORE
    public void restoreRoom(int roomId){
        Rooms roomToRestore = roomsRepository.findById(roomId).orElseThrow(() -> new NotFound("Room not found"));

        if (roomToRestore.getRoomStatus().equals(SoftDelete.Active)){
            throw new NoChangesDetected("Room is already active");
        }

        roomToRestore.setRoomStatus(SoftDelete.Active);
        roomsRepository.save(roomToRestore);
    }


}
