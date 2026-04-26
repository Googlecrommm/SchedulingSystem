package com.spring.Service;

import com.spring.Models.Logs;
import com.spring.Models.Users;
import com.spring.Repositories.LogsRepository;
import com.spring.Repositories.UsersRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class LogsService {
    private final LogsRepository logsRepository;
    private final UsersRepository usersRepository;

    public LogsService(LogsRepository logsRepository, UsersRepository usersRepository) {
        this.logsRepository = logsRepository;
        this.usersRepository = usersRepository;
    }

    //CREATE
    public void log(String logHeader, String description) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        Users currentUser = usersRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Logs log = new Logs();
        log.setUser(currentUser);
        log.setLogHeader(logHeader);
        log.setDescription(currentUser.getName() + " " + description);
        log.setCreatedAt(LocalDateTime.now());

        logsRepository.save(log);
    }
}
