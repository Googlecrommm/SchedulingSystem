package com.spring.Controller;

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

    //CREATE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping("createRoom")
    public ResponseEntity<SuccessResponse> createRoom(@RequestBody Rooms room) {
        roomsService.createRoom(room);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room Added"));
    }

    //READ & FILTER — all roles, department scoped via helper
    @PreAuthorize("isAuthenticated()")
    @GetMapping("getRooms")
    public ResponseEntity<Page<RoomResponseDTO>> getRooms(
            @RequestParam(required = false) SoftDelete roomStatus,
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

    //UPDATE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("updateRoom/{roomId}")
    public ResponseEntity<SuccessResponse> updateRoom(
            @PathVariable int roomId,
            @RequestBody Rooms room) {
        roomsService.updateRoom(roomId, room);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room Updated"));
    }

    //ARCHIVE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("archiveRoom/{roomId}")
    public ResponseEntity<SuccessResponse> archiveRoom(@PathVariable int roomId) {
        roomsService.archiveRoom(roomId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room Archived"));
    }

    //RESTORE — admin only
    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("restoreRoom/{roomId}")
    public ResponseEntity<SuccessResponse> restoreRoom(@PathVariable int roomId) {
        roomsService.restoreRoom(roomId);
        return ResponseEntity.ok().body(new SuccessResponse(200, "Room Restored"));
    }
}