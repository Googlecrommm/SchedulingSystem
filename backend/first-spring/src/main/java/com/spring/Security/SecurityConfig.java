package com.spring.Security;

import org.modelmapper.ModelMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
    private final UserDetailsServiceImpl userDetailsServiceImpl;
    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(UserDetailsServiceImpl userDetailsServiceImpl, JwtAuthFilter jwtAuthFilter){
        this.userDetailsServiceImpl = userDetailsServiceImpl;
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder(){
        return new BCryptPasswordEncoder();
    }

    @Bean
    public ModelMapper modelMapper(){
        return new ModelMapper();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsServiceImpl);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception{
        return config.getAuthenticationManager();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000" ,"http://localhost:5173", "http://localhost:5174"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }


    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/login", "/auth/register").permitAll()
                .anyRequest().authenticated());
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.authenticationProvider(authenticationProvider());
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()));
        return http.build();
    }
}
