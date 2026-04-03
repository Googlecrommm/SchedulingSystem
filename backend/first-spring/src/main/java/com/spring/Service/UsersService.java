package com.spring.Service;

import com.spring.Models.Users;
import com.spring.Repositories.UsersRepository;
import org.springframework.stereotype.Service;

@Service
public class UsersService {
    private final UsersRepository usersRepository;

    public UsersService(UsersRepository usersRepository){
        this.usersRepository = usersRepository;
    }

    //CREATE
    public Users addUser(Users user) throws Exception{
        if(usersRepository.existsByEmail(user.getEmail())){
            throw new Exception("User already exists");
        }
        return usersRepository.save(user);
    }


}
