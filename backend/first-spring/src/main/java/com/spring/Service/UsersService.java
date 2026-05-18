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

@Service
public class UsersService {
    private final UsersRepository usersRepository;
    private final ModelMapper modelMapper;
    private final PasswordEncoder passwordEncoder;
    private final LogsService logsService;

    public UsersService(UsersRepository usersRepository, ModelMapper modelMapper, PasswordEncoder passwordEncoder, LogsService logsService) {
        this.usersRepository = usersRepository;
        this.modelMapper = modelMapper;
        this.passwordEncoder = passwordEncoder;
        this.logsService = logsService;
    }

    // ─── Reusable DTO mapping helper ─────────────────────────────────────────────
    private UserResponseDTO mapToDTO(Users users) {
        UserResponseDTO dto = modelMapper.map(users, UserResponseDTO.class);
        dto.setFullName(users.getLastName() + ", " + users.getFirstName() + " "
                + (users.getMiddleName() == null ? "" : users.getMiddleName()));
        dto.setFirstName(users.getFirstName());                          // ADDED
        dto.setMiddleName(users.getMiddleName());                        // ADDED
        dto.setLastName(users.getLastName());                            // ADDED
        dto.setRoleName(users.getRole().getRoleName());
        dto.setRoleId(users.getRole().getRoleId());                      // ADDED
        dto.setDepartmentName(users.getRole().getDepartment().getDepartmentName());
        return dto;
    }

    //READ
    public Page<UserResponseDTO> getUsers(String accountStatus, String departmentName, String roleName, Pageable pageable) {
        Specification<Users> filters = Specification
                .where(UserSpecification.excludeRole()) // Exclude soft-deleted users
                .and(UserSpecification.hasDepartment(departmentName))
                .and(UserSpecification.hasRole(roleName))
                .and(UserSpecification.hasAccountStatus(accountStatus));

        return usersRepository.findAll(filters, pageable).map(this::mapToDTO);
    }

    //SEARCH USER BY NAME
    public Page<UserResponseDTO> searchUser(String searchName, Pageable pageable) {
        return usersRepository
                .findByFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(searchName, searchName, pageable)
                .map(this::mapToDTO);
    }

    //READ (ID)
    public UserResponseDTO getUserById(int userId) throws NotFound {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new NotFound("User not found"));
        return mapToDTO(user);
    }

    //UPDATE
    public void updateUser(int userId, Users user) throws UsernameNotFoundException {
        Users userToUpdate = usersRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User doesn't exists"));

        String name = userToUpdate.getLastName() + ", " + userToUpdate.getFirstName() + " " +
                (userToUpdate.getMiddleName() == null ? "" : userToUpdate.getMiddleName());

        if (user.getFirstName() != null && !user.getFirstName().isEmpty()) {
            userToUpdate.setFirstName(user.getFirstName());
        }

        String incomingMiddleName = user.getMiddleName();
        if (incomingMiddleName == null || incomingMiddleName.trim().isEmpty()) {
            userToUpdate.setMiddleName(null);
        } else {
            userToUpdate.setMiddleName(incomingMiddleName.trim());
        }

        if (user.getLastName() != null && !user.getLastName().isEmpty()) {
            userToUpdate.setLastName(user.getLastName());
        }

        if (user.getEmail() != null && !user.getEmail().isEmpty()) {
            userToUpdate.setEmail(user.getEmail());
        }

        if (user.getRole() != null) {
            userToUpdate.setRole(user.getRole());
        }

        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            userToUpdate.setPassword(passwordEncoder.encode(user.getPassword()));
        }

        if (user.getAccountStatus() != null) {
            userToUpdate.setAccountStatus(user.getAccountStatus());
        }

        logsService.log("User Information Updated", "updated the information of " + name);
        usersRepository.save(userToUpdate);
    }

    //DISABLE ACCOUNT
    public void disableAccount(int userId) {
        Users userToDisable = usersRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String name = userToDisable.getLastName() + ", " + userToDisable.getFirstName() + " " +
                (userToDisable.getMiddleName() == null ? "" : userToDisable.getMiddleName());

        if (userToDisable.getRole().getRoleName().equals("Admin")) {
            throw new NotAllowed("Admin can't be disabled");
        }

        if (userToDisable.getAccountStatus().equals(AccountStatus.Disabled)) {
            throw new NoChangesDetected("This account is already disabled");
        }

        userToDisable.setAccountStatus(AccountStatus.Disabled);
        logsService.log("User Account Disabled", "disabled the account of " + name);
        usersRepository.save(userToDisable);
    }

    //ACTIVE ACCOUNT
    public void activateAccount(int userId) {
        Users userToActivate = usersRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        String name = userToActivate.getLastName() + ", " + userToActivate.getFirstName() + " " +
                (userToActivate.getMiddleName() == null ? "" : userToActivate.getMiddleName());

        if (userToActivate.getAccountStatus().equals(AccountStatus.Active)) {
            throw new NoChangesDetected("This account is already active");
        }

        userToActivate.setAccountStatus(AccountStatus.Active);
        logsService.log("User Account Activated", "activated the account of " + name);
        usersRepository.save(userToActivate);
    }
}