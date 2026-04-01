package com.spring.Service;

import com.spring.Models.Roles;
import com.spring.Repositories.RolesRepository;
import org.springframework.stereotype.Service;

@Service
public class RolesService {
    private final RolesRepository rolesRepository;

    public RolesService(RolesRepository rolesRepository){
        this.rolesRepository = rolesRepository;
    }

    //CREATE ROLE
    public Roles addRole(Roles role){
        return rolesRepository.save(role);
    }
}
