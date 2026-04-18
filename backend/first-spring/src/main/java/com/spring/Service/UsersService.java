package com.spring.Service;

import com.spring.Enums.AccountStatus;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotAllowed;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Users;
import com.spring.Repositories.UsersRepository;
import com.spring.Specifications.UserSpecification;
import com.spring.dto.UserResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.LinkedList;
import java.util.List;

@Service
public class UsersService {
    private final UsersRepository usersRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;

    public UsersService(UsersRepository usersRepository, ModelMapper modelMapper, PasswordEncoder passwordEncoder){
        this.usersRepository = usersRepository;
        this.modelMapper = modelMapper;
        this.passwordEncoder = passwordEncoder;
    }

    //READ
    public Page<UserResponseDTO> getUsers(String accountStatus, String departmentName, String roleName, Pageable pageable){

        Specification<Users> filters = Specification
                .where(UserSpecification.excludeRole())
                .and(UserSpecification.hasDepartment(departmentName))
                .and(UserSpecification.hasRole(roleName))
                .and(UserSpecification.hasAccountStatus(accountStatus));


        return usersRepository
                .findAll(filters, pageable)
                .map(users -> {
                    UserResponseDTO userResponseDTO = modelMapper.map(users, UserResponseDTO.class);
                    userResponseDTO.setRoleName(users.getRole().getRoleName());
                    userResponseDTO.setDepartmentName(users.getRole().getDepartment().getDepartmentName());
                    return userResponseDTO;
                });
    }

    //SEARCH ROLE BY NAME
    public Page<UserResponseDTO> searchUser(String searchName, Pageable pageable){
        return usersRepository
                .searchAllByNameContaining(searchName, pageable)
                .map(users -> {
                    UserResponseDTO userDTO = modelMapper.map(users, UserResponseDTO.class);
                    userDTO.setRoleName(users.getRole().getRoleName());
                    userDTO.setDepartmentName(users.getRole().getDepartment().getDepartmentName());
                    return userDTO;
                });
    }

    //READ (ID)
    public UserResponseDTO getUserById(int userId) throws NotFound {
        Users user = usersRepository.findById(userId).orElseThrow(() -> new NotFound("User not found"));

        UserResponseDTO dto = modelMapper.map(user, UserResponseDTO.class);
        dto.setRoleName(user.getRole().getRoleName());

        return dto;
    }

    //UPDATE
    public void updateUser(int userId, Users user) throws UsernameNotFoundException {
        Users userToUpdate = usersRepository.findById(userId).orElseThrow(() -> new UsernameNotFoundException("User doesn't exists"));

        if (user.getName() != null && !user.getName().isEmpty()){
            userToUpdate.setName(user.getName());
        }

        if (user.getEmail() != null && !user.getEmail().isEmpty()){
            userToUpdate.setEmail(user.getEmail());
        }

        if(user.getRole() != null){
            userToUpdate.setRole(user.getRole());
        }

        if (user.getPassword() != null && !user.getPassword().isEmpty()){
            userToUpdate.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        if (user.getAccountStatus() != null){
            userToUpdate.setAccountStatus(user.getAccountStatus());
        }

        usersRepository.save(userToUpdate);
    }

    //DISABLE ACCOUNT
    public void disableAccount(int userId){
        Users userToDisable = usersRepository.findById(userId).orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if(userToDisable.getRole().getRoleName().equals("Admin")){
            throw new NotAllowed("Admin can't be disabled");
        }

        if (userToDisable.getAccountStatus().equals(AccountStatus.Disabled)){
            throw new NoChangesDetected("This account is already disabled");
        }

        userToDisable.setAccountStatus(AccountStatus.Disabled);
        usersRepository.save(userToDisable);
    }

    //ACTIVE ACCOUNT
    public void activateAccount(int userId){
        Users userToActivate = usersRepository.findById(userId).orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if(userToActivate.getAccountStatus().equals(AccountStatus.Active)){
            throw new NoChangesDetected("This account is already active");
        }

        userToActivate.setAccountStatus(AccountStatus.Active);
        usersRepository.save(userToActivate);
    }


}
