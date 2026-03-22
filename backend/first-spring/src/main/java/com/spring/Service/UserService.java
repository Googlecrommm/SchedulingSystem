package com.spring.Service;

import com.spring.Models.Users;
import com.spring.Repositories.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository){
        this.userRepository = userRepository;
    }

    public List<Users> getUsers(){
        return userRepository.findAll();
    }
}
