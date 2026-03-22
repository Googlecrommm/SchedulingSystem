package com.spring.Models;

import com.spring.Enums.Role;

public class Users {
    private int userID = 0;
    private String name;
    private Role role;

    public Users(int userID, String name, Role role) {
        this.userID = userID;
        this.name = name;
        this.role = role;
    }

    public int getUserID() {
        return userID;
    }


    public String getName() {
        return name;
    }


    public Role getRole() {
        return role;
    }

}
