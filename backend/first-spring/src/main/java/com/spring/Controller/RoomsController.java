package com.spring.Controller;

import com.spring.Enums.MachineStatus;
import com.spring.Enums.SoftDelete;
import com.spring.Models.Rooms;
import com.spring.Security.DepartmentSecurityHelper;
import com.spring.Service.RoomsService;
import com.spring.dto.RoomResponseDTO;
import com.spring.dto.SuccessResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class RoomsController {
    private final RoomsService roomsService;
    private final DepartmentSecurityHelper departmentSecurityHelper;

    public RoomsController(RoomsService roomsService, DepartmentSecurityHelper departmentSecurityHelper) {
        this.roomsService = roomsService;
        this.departmentSecurityHelper = departmentSecurityHelper;
    }

    //CREATE — admin and frontdesk, frontdesk scoped to their department
    @PreAuthorize("isAuthenticated()")
    @PostMapping("createRoom")
    public ResponseEntity<SuccessResponse> createRoom(
            @RequestBody Rooms room,
            Authentication authentication) {
        roomsService.createRoom(room, authentication);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room Added"));
    }

    //READ & FILTER — all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("getRooms")
    public ResponseEntity<Page<RoomResponseDTO>> getRooms(
            @RequestParam(required = false) MachineStatus roomStatus,
            @RequestParam(required = false) String departmentName,
            Pageable pageable,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(departmentName, authentication);

        return ResponseEntity.ok(roomsService.getRooms(roomStatus, effectiveDept, pageable));
    }

    //SEARCH — all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("searchRoom/{roomName}")
    public ResponseEntity<Page<RoomResponseDTO>> searchRoom(
            @PathVariable String roomName,
            Pageable pageable,
            Authentication authentication) {

        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(null, authentication);

        return ResponseEntity.ok(roomsService.searchRoom(roomName, effectiveDept, pageable));
    }

    //DROPDOWN — all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("roomDropdown")
    public ResponseEntity<List<RoomResponseDTO>> roomDropdown(Authentication authentication) {
        String effectiveDept = departmentSecurityHelper
                .resolveEffectiveDepartment(null, authentication);

        return ResponseEntity.ok(roomsService.roomsDropdown(effectiveDept));
    }

    //UPDATE — admin and frontdesk, frontdesk scoped to their department
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    @PutMapping("updateRoom/{roomId}")
    public ResponseEntity<SuccessResponse> updateRoom(
            @PathVariable int roomId,
            @RequestBody Rooms room,
            Authentication authentication) {
        roomsService.updateRoom(roomId, room, authentication);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room Updated"));
    }

    //ARCHIVE — admin and frontdesk, frontdesk scoped to their department
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    @PutMapping("archiveRoom/{roomId}")
    public ResponseEntity<SuccessResponse> archiveRoom(
            @PathVariable int roomId,
            Authentication authentication) {
        roomsService.archiveRoom(roomId, authentication);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room Archived"));
    }

    //MARK AS UNDER MAINTENANCE
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    @PutMapping("markMaintenance/{roomId}")
    public ResponseEntity<SuccessResponse> markAsMaintentance(
            @PathVariable int roomId,
            Authentication authentication
    ){
        roomsService.markAsMaintenance(roomId, authentication);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room marked as under maintenance"));
    }


    //RESTORE — admin and frontdesk, frontdesk scoped to their department
    @PreAuthorize("hasAnyRole('ADMIN', 'FRONTDESK')")
    @PutMapping("restoreRoom/{roomId}")
    public ResponseEntity<SuccessResponse> restoreRoom(
            @PathVariable int roomId,
            Authentication authentication) {
        roomsService.restoreRoom(roomId, authentication);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room Restored"));
    }
}