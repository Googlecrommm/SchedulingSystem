package com.spring.Controller;

import com.spring.Enums.SoftDelete;
import com.spring.Models.Rooms;
import com.spring.Service.RoomsService;
import com.spring.dto.RoomResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RoomsController {
    private final RoomsService roomsService;

    public RoomsController(RoomsService roomsService) {
        this.roomsService = roomsService;
    }

    //CREATE
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("createRoom")
    public ResponseEntity<SuccessResponse> createRoom(@RequestBody Rooms room){
        roomsService.createRoom(room);
        return ResponseEntity.ok().body(new SuccessResponse(200,"Room added"));
    }

    //READ & FILTER
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("getRooms")
    public ResponseEntity<Page<RoomResponseDTO>> getRooms(
            @RequestParam(required = false) SoftDelete roomStatus,
            @RequestParam(required = false) String departmentName,
            Pageable pageable
    ){
        return ResponseEntity.ok(roomsService.getRooms(roomStatus, departmentName, pageable));
    }

    //SEARCH
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("searchRoom/{roomName}")
    public ResponseEntity<Page<RoomResponseDTO>> searchRoom(
            @PathVariable String roomName,
            Pageable pageable
    ){
        return ResponseEntity.ok(roomsService.searchRoom(roomName, pageable));
    }

    //DROPDOWN
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("roomDropdown")
    public ResponseEntity<List<RoomResponseDTO>> roomDropdown(){
        return ResponseEntity.ok(roomsService.roomsDropdown());
    }

    //UPDATE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("updateRoom/{roomId}")
    public ResponseEntity<SuccessResponse> updateRoom(
            @PathVariable int roomId,
            @RequestBody Rooms room
    ){
        roomsService.updateRoom(roomId, room);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room updated"));
    }

    //ARCHIVE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("archiveRoom/{roomId}")
    public ResponseEntity<SuccessResponse> archiveRoom(
            @PathVariable int roomId
    ){
        roomsService.archiveRoom(roomId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room archived"));
    }

    //RESTORE
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("restoreRoom/{roomId}")
    public ResponseEntity<SuccessResponse> restoreRoom(
            @PathVariable int roomId
    ){
        roomsService.restoreRoom(roomId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room restored"));
    }
}
