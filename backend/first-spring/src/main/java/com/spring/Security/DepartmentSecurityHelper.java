package com.spring.Security;

import com.spring.Models.Users;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

@Component
public class DepartmentSecurityHelper {

    public String resolveEffectiveDepartment(String requestedDepartment, Authentication auth) {

        // If ADMIN, trust whatever the frontend sends (null = all departments)
        if (auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return (requestedDepartment == null || requestedDepartment.isBlank())
                    ? null
                    : requestedDepartment;
        }

        // For non-admins, extract department from their Users principal
        Users user = (Users) auth.getPrincipal();

        if (user.getRole() == null || user.getRole().getDepartment() == null) {
            return null; // no department assigned, sees nothing filtered
        }

        return user.getRole().getDepartment().getDepartmentName();
    }
}