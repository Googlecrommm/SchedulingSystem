package com.spring.Models;

import com.spring.Enums.AccountStatus;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

import java.util.List;

@Entity
@Table(name = "users")
public class Users {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "userId")
    private int userId;

    @ManyToOne
    @JoinColumn(name = "roleId")
    private Roles role;

    @Column(name = "accountStatus", nullable = false)
    @Enumerated(EnumType.STRING )
    private AccountStatus accountStatus = AccountStatus.Active;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @NotBlank
    @Size(max = 100)
    @Email
    @Column(name = "email", nullable = false, length = 150)
    private String email;

    @NotBlank
    @Size(min = 1, max = 255)
    @Column(name = "password", nullable = false, length = 255)
    private String password;

    public Users(){}

    @OneToMany(mappedBy = "user")
    private List<Schedules> schedule;

    public List<Schedules> getSchedule() {
        return schedule;
    }

    public void setSchedule(List<Schedules> schedule) {
        this.schedule = schedule;
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

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
