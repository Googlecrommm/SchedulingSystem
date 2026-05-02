package com.spring.Service;

import com.spring.Enums.AccountStatus;
import com.spring.Exceptions.AlreadyExists;
import com.spring.Exceptions.NotAllowed;
import com.spring.Exceptions.NotFound;
import com.spring.Models.Users;
import com.spring.Repositories.UsersRepository;
import com.spring.Security.JwtService;
import com.spring.Security.TokenBlacklistService;
import com.spring.dto.AuthResponseDTO;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AuthService {
    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final LogsService logsService;
    private final TokenBlacklistService tokenBlacklistService;

    public AuthService(UsersRepository usersRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuthenticationManager authenticationManager,
                       LogsService logsService, TokenBlacklistService tokenBlacklistService) {
        this.usersRepository = usersRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.logsService = logsService;
        this.tokenBlacklistService = tokenBlacklistService;
    }

    //REGISTER
    public Users register(Users user) throws AlreadyExists {
        if (usersRepository.existsByEmail(user.getEmail())) {
            throw new AlreadyExists("User already exists");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return usersRepository.save(user);
    }

    //LOGIN
    public AuthResponseDTO login(Users user) throws UsernameNotFoundException {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getEmail(), user.getPassword())
        );
        Users getUser = usersRepository.findByEmail(user.getEmail())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (getUser.getAccountStatus().equals(AccountStatus.Disabled)) {
            throw new NotAllowed("This account is disabled");
        }

        String fullName = getUser.getLastName() + ", " + getUser.getFirstName() + " "
                + (getUser.getMiddleName() == null ? "" : getUser.getMiddleName());

        String departmentName = getUser.getRole().getDepartment() != null
                ? getUser.getRole().getDepartment().getDepartmentName()
                : null;

        logsService.log("Login", "logged in");

        return new AuthResponseDTO(
                jwtService.generateToken(getUser),
                fullName,
                getUser.getRole().getRoleName(),
                departmentName
        );
    }

    //LOGOUT
    public void logout(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            tokenBlacklistService.blacklist(token);
            logsService.log("Logout", "logged out");
        }
    }
}
