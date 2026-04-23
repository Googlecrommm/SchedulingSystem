package com.spring.Security;

import com.spring.Models.Departments;
import com.spring.Models.Users;
import com.spring.Repositories.UsersRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service("customSecurity")
public class CustomSecurityService {

    private final UsersRepository usersRepository;

    public CustomSecurityService(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }

    public boolean hasDepartment(String departmentName) {
        String email = SecurityContextHolder.getContext()
                .getAuthentication()
                .getName();

        Users currentUser = usersRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Exclude ADMIN regardless of their department
        if (currentUser.getRole().getRoleName().equalsIgnoreCase("ADMIN")) {
            return false;
        }

        Departments department = currentUser.getRole().getDepartment();

        if (department == null) return false;

        return department.getDepartmentName().equalsIgnoreCase(departmentName);
    }
}
