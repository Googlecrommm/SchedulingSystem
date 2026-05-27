package com.spring.service;

import com.spring.Enums.AccountStatus;
import com.spring.Exceptions.NoChangesDetected;
import com.spring.Exceptions.NotAllowed;
import com.spring.Models.Roles;
import com.spring.Models.Users;
import com.spring.Repositories.UsersRepository;
import com.spring.Service.LogsService;
import com.spring.Service.UsersService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UsersRepository usersRepository;

    @Mock
    private LogsService logsService;

    @InjectMocks
    private UsersService usersService;

    //DISABLE ACCOUNT (HAPPY PATH)
    @Test
    void shouldReturnUserWhenUserExists(){
        //ARRANGE
        Users fakeUser = new Users();
        Roles fakeRole = new Roles();
        fakeRole.setRoleName("Frontdesk");
        fakeUser.setFirstName("Cromwell");
        fakeUser.setLastName("Naval");
        fakeUser.setAccountStatus(AccountStatus.Active);
        fakeUser.setRole(fakeRole);
        when(usersRepository.findById(1)).thenReturn(Optional.of(fakeUser));

        //ACT
        usersService.disableAccount(1);

        //ASSERT
        verify(usersRepository).save(fakeUser);
        assertEquals(AccountStatus.Disabled, fakeUser.getAccountStatus());
    }

    //DISABLE ACCOUNT (USER DOES NOT EXIST)
    @Test
    void shouldThrowExceptionWhenUserNotFound(){
        //ARRANGE
        when(usersRepository.findById(99)).thenReturn(Optional.empty());

        //ACT + ASSERT
        assertThrows(UsernameNotFoundException.class, () -> {
            usersService.disableAccount(99);
        });
    }

    //DISABLE ACCOUNT (USER IS ADMIN)
    @Test
    void shouldThrowExceptionWhenUserIsAdmin(){
        //ARRANGE
        Roles fakeRole = new Roles();
        fakeRole.setRoleName("Admin");

        Users fakeUser = new Users();
        fakeUser.setFirstName("Cromwell");
        fakeUser.setLastName("Naval");
        fakeUser.setRole(fakeRole);
        when(usersRepository.findById(1)).thenReturn(Optional.of(fakeUser));

        //ACT + ASSERT
        assertThrows(NotAllowed.class, () -> {
            usersService.disableAccount(1);
        });
    }

    //DISABLE ACCOUNT (ACCOUNT ALREADY DISABLED)
    @Test
    void shouldThrowExceptionWhenUserIsAlreadyDisabled(){
        //ARRANGE
        Roles fakeRole = new Roles();
        fakeRole.setRoleName("Frontdesk");

        Users fakeUser = new Users();
        fakeUser.setFirstName("John");
        fakeUser.setLastName("Doe");
        fakeUser.setRole(fakeRole);
        fakeUser.setAccountStatus(AccountStatus.Disabled);
        when(usersRepository.findById(1)).thenReturn(Optional.of(fakeUser));

        //ACT + ASSERT
        assertThrows(NoChangesDetected.class, () -> {
            usersService.disableAccount(1);
        });
    }
}
