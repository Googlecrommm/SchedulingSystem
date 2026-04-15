package com.spring.Service;

import com.spring.Enums.SoftDelete;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NotFound;
import com.spring.Exceptions.RoleNotFound;
import com.spring.Models.Roles;
import com.spring.Repositories.RolesRepository;
import com.spring.dto.RoleResponseDTO;
import org.modelmapper.ModelMapper;
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
    public List<RoleResponseDTO> getRoles(){
        List<Roles> allRoles = rolesRepository.findAll();
        List<RoleResponseDTO> allRolesDTO = new LinkedList<>();
        for (Roles allRole : allRoles) {
            RoleResponseDTO roleDTO = modelMapper.map(allRole, RoleResponseDTO.class);
            roleDTO.setDepartmentName(allRole.getDepartment().getDepartmentName());
            allRolesDTO.add(roleDTO);
        }

        return allRolesDTO;
    }

    //UPDATE
    public void updateRole(int roleId, Roles role){
        Roles roleToUpdate = rolesRepository.findById(roleId).orElseThrow(() -> new RoleNotFound("Role doesn't exists"));

        if (role.getRoleName() != null && !role.getRoleName().isEmpty() && !roleToUpdate.getRoleName().equalsIgnoreCase("Admin")){
            roleToUpdate.setRoleName(role.getRoleName());
        }

        if (role.getRoleStatus() != null){
            roleToUpdate.setRoleStatus(role.getRoleStatus());
        }

        if (role.getDepartment() != null){
            roleToUpdate.setDepartment(role.getDepartment());
        }

        rolesRepository.save(roleToUpdate);
    }

    //ARCHIVE
    public void archiveRole(int roleId){
        Roles roleToArchive = rolesRepository.findById(roleId).orElseThrow(() -> new RoleNotFound("Role doesn't exist"));
        roleToArchive.setRoleStatus(SoftDelete.Archived);
        rolesRepository.save(roleToArchive);
    }

    //RESTORE
    public void restoreRole(int roleId){
        Roles roleToRestore = rolesRepository.findById(roleId).orElseThrow(() -> new RoleNotFound("Role doesn't exist"));
        roleToRestore.setRoleStatus(SoftDelete.Active);
        rolesRepository.save(roleToRestore);
    }

}
