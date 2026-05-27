package com.spring.controller;

import com.spring.Controller.UserController;
import com.spring.Exceptions.NotAllowed;
import com.spring.Security.JwtAuthFilter;
import com.spring.Security.JwtService;
import com.spring.Security.UserDetailsServiceImpl;
import com.spring.Service.UsersService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;

@WebMvcTest(UserController.class)
@AutoConfigureMockMvc(addFilters = false)
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @MockitoBean
    private JwtAuthFilter jwtAuthFilter;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private UsersService usersService;

    @Test
    void shouldReturnDisableAccountWhenAdminCallsEndpoint() throws Exception {
        //ARRANGE
        doNothing().when(usersService).disableAccount(2);

        //ACT + ASSERT
        mockMvc.perform(put("/api/disableUser/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Account Disabled"));
    }

    @Test
    void shouldReturnNotAllowedWhenEndpointUsedOnAdmin() throws Exception {
        //ARRANGE
        doThrow(new NotAllowed("Admin can't be disabled"))
                .when(usersService).disableAccount(1);

        //ACT + ASSERT
        mockMvc.perform(put("/api/disableUser/1").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldReturnActivateAccountWhenAdminCallsEndpoint() throws Exception {
        //ARRANGE
        doNothing().when(usersService).activateAccount(1);

        //ACT + ASSERT
        mockMvc.perform(put("/api/activateUser/1").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Account Activated"));
    }


}
