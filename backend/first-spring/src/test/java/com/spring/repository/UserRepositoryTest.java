package com.spring.repository;

import com.spring.Models.Departments;
import com.spring.Models.Roles;
import com.spring.Models.Users;
import com.spring.Repositories.DepartmentsRepository;
import com.spring.Repositories.RolesRepository;
import com.spring.Repositories.UsersRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
public class UserRepositoryTest {

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private RolesRepository rolesRepository;

    @Autowired
    private DepartmentsRepository departmentsRepository;

    @Test
    void shouldReturnUserWhenEmailExists(){
        //ARRANGE

        //CREATE DEPARTMENT
        Departments fakeDepartment = new Departments();
        fakeDepartment.setDepartmentName("ICTD");
        departmentsRepository.save(fakeDepartment);

        //CREATE ROLE
        Roles fakeRole = new Roles();
        fakeRole.setRoleName("Frontdesk");
        fakeRole.setDepartment(fakeDepartment);
        rolesRepository.save(fakeRole);

        //CREATE USER
        Users fakeUser = new Users();
        fakeUser.setFirstName("Cromwell");
        fakeUser.setLastName("Naval");
        fakeUser.setEmail("fakemail@gmail.com");
        fakeUser.setPassword("secret@123");
        fakeUser.setRole(fakeRole);
        usersRepository.save(fakeUser);

        //ACT
        Optional<Users> result = usersRepository.findByEmail("fakemail@gmail.com");

        //ASSERT
        assertTrue(result.isPresent());
        assertEquals("fakemail@gmail.com", result.get().getEmail());
    }

    @Test
    void shouldThrowEmptyWhenEmailNotFound(){
        //ACT
        Optional<Users> result = usersRepository.findByEmail("somemail@gmail.com");

        //ASSERT
        assertFalse(result.isPresent());
    }

}
