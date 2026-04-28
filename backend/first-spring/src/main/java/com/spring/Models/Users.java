package com.spring.Models;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.spring.Enums.AccountStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
public class Users implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "userId")
    private int userId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "roleId", nullable = false)
    private Roles role;

    @Column(name = "accountStatus", nullable = false)
    @Enumerated(EnumType.STRING)
    private AccountStatus accountStatus = AccountStatus.Active;

    @NotBlank
    @Size(max = 100)
    @Column(name = "firstName", nullable = false, length = 100)
    private String firstName;

    @Size(max = 100)
    @Column(name = "middleName", nullable = true, length = 100)
    private String middleName;

    @NotBlank
    @Size(max = 100)
    @Column(name = "lastName", nullable = false, length = 100)
    private String lastName;

    @NotBlank
    @Size(max = 150)
    @Email
    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @NotBlank
    @Size(max = 255)
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @OneToMany(mappedBy = "user")
    private List<Logs> logs;

    public Users(){}

    @Override
    public String getUsername(){
        return email;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities(){
        if(role == null || role.getRoleName() == null) {
            return List.of();
        }
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.getRoleName().toUpperCase()));
    }

    @Override
    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public int getUserId() {
        return userId;
    }

    public void setUserId(int userId) {
        this.userId = userId;
    }

    public Roles getRole() {
        return role;
    }

    public void setRole(Roles role) {
        this.role = role;
    }

    public AccountStatus getAccountStatus() {
        return accountStatus;
    }

    public void setAccountStatus(AccountStatus accountStatus) {
        this.accountStatus = accountStatus;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getMiddleName() {
        return middleName;
    }

    public void setMiddleName(String middleName) {
        this.middleName = middleName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public List<Logs> getLogs() {
        return logs;
    }

    public void setLogs(List<Logs> logs) {
        this.logs = logs;
    }
}
