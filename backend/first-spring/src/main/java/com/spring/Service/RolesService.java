package com.spring.Service;

import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.*;
import com.spring.Models.Roles;
import com.spring.Repositories.RolesRepository;
import com.spring.Specifications.RoleSpecification;
import com.spring.dto.RoleResponseDTO;
import com.spring.dto.SuccessResponse;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import javax.management.relation.RoleNotFoundException;
import java.util.LinkedList;
import java.util.List;

@Service
public class RolesService {
    private final RolesRepository rolesRepository;
    private final ModelMapper modelMapper;

    public RolesService(RolesRepository rolesRepository, ModelMapper modelMapper){
        this.rolesRepository = rolesRepository;
        this.modelMapper = modelMapper;
    }

    //CREATE ROLE
    public void addRole(Roles role){
        if (role.getRoleName().equalsIgnoreCase("Admin")){
            throw new NotAllowed("Creating Admin role is not allowed");
        }
        rolesRepository.save(role);
    }

    //READ ALL
    public Page<RoleResponseDTO> getRoles(String status, String departmentName, Pageable pageable){
        Specification<Roles> filters = Specification
                .where(RoleSpecification.hasStatus(status))
                .and(RoleSpecification.hasDepartment(departmentName))
                .and(RoleSpecification.excludeRole());

        return rolesRepository
                .findAll(filters, pageable)
                .map(roles -> {
                    RoleResponseDTO roleDTO = modelMapper.map(roles, RoleResponseDTO.class);
                    roleDTO.setDepartmentName(roles.getDepartment().getDepartmentName());
                    return roleDTO;
                });
    }

    //READ ALL (DROPDOWN)
    // RolesService.java
    public List<RoleResponseDTO> roleDropdown(String departmentName) {
        Specification<Roles> filters = Specification
                .where(RoleSpecification.excludeRole())          // excludes Admin
                .and(RoleSpecification.hasStatus("Active"))      // only active roles
                .and(RoleSpecification.hasDepartment(departmentName)); // null = all, set = scoped

        return rolesRepository.findAll(filters).stream()
                .map(roles -> {
                    RoleResponseDTO roleDTO = modelMapper.map(roles, RoleResponseDTO.class);
                    roleDTO.setDepartmentName(roles.getDepartment().getDepartmentName());
                    return roleDTO;
                })
                .toList();
    }

    //FRONTDESK DROPDOWN
    public List<RoleResponseDTO> frontdeskDropdown(){
        return rolesRepository.findAllByRoleNameIgnoreCase("Frontdesk")
        .stream()
        .map(roles -> {
            RoleResponseDTO roleDTO = modelMapper.map(roles, RoleResponseDTO.class);
            roleDTO.setDepartmentName(roles.getDepartment().getDepartmentName());
            return roleDTO;
            })
            .toList();
    }

    //DOCTORS DROPDOWN
    public List<RoleResponseDTO> doctorRoleDropdown(String departmentName) {
        Specification<Roles> filters = Specification
                .where(RoleSpecification.excludeRole())       // excludes Admin
                .and(RoleSpecification.excludeSystemRoles())  // excludes Frontdesk + other login roles
                .and(RoleSpecification.hasStatus("Active"))
                .and(RoleSpecification.hasDepartment(departmentName));

        return rolesRepository.findAll(filters).stream()
                .map(roles -> {
                    RoleResponseDTO roleDTO = modelMapper.map(roles, RoleResponseDTO.class);
                    roleDTO.setDepartmentName(roles.getDepartment().getDepartmentName());
                    return roleDTO;
                })
                .toList();
    }


    //SEARCH ROLE BY NAME
    public Page<RoleResponseDTO> searchRole(String searchName, Pageable pageable){
        return rolesRepository
                .searchRoleByName(searchName, pageable)
                .map(roles -> {
                    RoleResponseDTO roleDto = modelMapper.map(roles, RoleResponseDTO.class);
                    roleDto.setDepartmentName(roles.getDepartment().getDepartmentName());
                    return roleDto;
                });
    }

    //COUNT ROLES
    public long countRoles(){
        return rolesRepository.count();
    }

    //UPDATE
    public void updateRole(int roleId, Roles role){
        Roles roleToUpdate = rolesRepository.findById(roleId).orElseThrow(() -> new RoleNotFound("Role doesn't exists"));

        if (roleToUpdate.getRoleName().equalsIgnoreCase("Admin")){
            throw new NotAllowed("Edit not allowed");
        }

        if (role.getRoleName().equalsIgnoreCase("Admin")){
            throw new NotAllowed("Role can't be set to admin");
        }

        if (role.getRoleName() != null && !role.getRoleName().isEmpty() && !roleToUpdate.getRoleName().equalsIgnoreCase("Admin")){
            roleToUpdate.setRoleName(role.getRoleName());
        }

        if (role.getDepartment() != null){
            roleToUpdate.setDepartment(role.getDepartment());
        }

        roleToUpdate.setRoleStatus(roleToUpdate.getRoleStatus());

        rolesRepository.save(roleToUpdate);
    }

    //ARCHIVE
    public void archiveRole(int roleId){
        Roles roleToArchive = rolesRepository.findById(roleId).orElseThrow(() -> new RoleNotFound("Role doesn't exist"));

        if (roleToArchive.getRoleStatus().equals(SoftDelete.Archived)){
            throw new NoChangesDetected("This role is already archived");
        }
        if (roleToArchive.getRoleId() != 1 && !roleToArchive.getRoleName().equalsIgnoreCase("Admin")){
            roleToArchive.setRoleStatus(SoftDelete.Archived);
            rolesRepository.save(roleToArchive);
        }
        else {
            throw new NotAllowed("Admin can't be archived");
        }


    }

    //RESTORE
    public void restoreRole(int roleId){
        Roles roleToRestore = rolesRepository.findById(roleId).orElseThrow(() -> new RoleNotFound("Role doesn't exist"));

        if(roleToRestore.getRoleStatus().equals(SoftDelete.Active)){
            throw new NoChangesDetected("This role is already active");
        }

        roleToRestore.setRoleStatus(SoftDelete.Active);
        rolesRepository.save(roleToRestore);
    }

}
