package com.spring.Repositories;

import com.spring.Enums.Role;
import com.spring.Models.Users;

import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class UserRepository {

    public List<Users> findAll(){
        return List.of(
          new Users(1, "Crom", Role.ADMIN),
          new Users(2, "Rhon", Role.PATIENT),
          new Users(3, "Ralf", Role.PATIENT),
          new Users(4,"Sachi", Role.PATIENT)
        );
    }
}
