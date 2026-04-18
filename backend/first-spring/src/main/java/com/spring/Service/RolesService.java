package com.spring.Service;

import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NotFound;
import com.spring.Exceptions.RoleNotFound;
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
       if (rolesRepository.existsByRoleName(role.getRoleName())){
           throw new AlreadyExists("Role already exists");
       }
        rolesRepository.save(role);
    }

    //READ ALL
    public Page<RoleResponseDTO> getRoles(String status, String departmentName, Pageable pageable){
        Specification<Roles> filters = Specification
                .where(RoleSpecification.hasStatus(status))
                .and(RoleSpecification.hasDepartment(departmentName));

        return rolesRepository
                .findAll(filters, pageable)
                .map(roles -> {
                    RoleResponseDTO roleDTO = modelMapper.map(roles, RoleResponseDTO.class);
                    roleDTO.setDepartmentName(roles.getDepartment().getDepartmentName());
                    return roleDTO;
                });
    }

    //READ ALL (DROPDOWN)
    public List<RoleResponseDTO> roleDropdown(){
        return rolesRepository.findAllByRoleStatusNot(SoftDelete.Archived)
                .stream()
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
        if (roleToArchive.getRoleId() != 1 && !roleToArchive.getRoleName().equalsIgnoreCase("Admin")){
            roleToArchive.setRoleStatus(SoftDelete.Archived);
            rolesRepository.save(roleToArchive);
        }
        new SuccessResponse(400, "Admin can't be archived");
    }

    //RESTORE
    public void restoreRole(int roleId){
        Roles roleToRestore = rolesRepository.findById(roleId).orElseThrow(() -> new RoleNotFound("Role doesn't exist"));
        roleToRestore.setRoleStatus(SoftDelete.Active);
        rolesRepository.save(roleToRestore);
    }

}
