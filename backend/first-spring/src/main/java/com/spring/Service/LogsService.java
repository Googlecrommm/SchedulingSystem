package com.spring.Service;

import com.spring.Models.Logs;
import com.spring.Models.Users;
import com.spring.Repositories.LogsRepository;
import com.spring.Repositories.UsersRepository;
import com.spring.Specifications.LogsSpecification;
import com.spring.dto.LogResponseDTO;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class LogsService {
    private final LogsRepository logsRepository;
    private final UsersRepository usersRepository;
    private final ModelMapper modelMapper;

    public LogsService(LogsRepository logsRepository, UsersRepository usersRepository, ModelMapper modelMapper) {
        this.logsRepository = logsRepository;
        this.usersRepository = usersRepository;
        this.modelMapper = modelMapper;
    }

    //CREATE
    public void log(String logHeader, String description) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        Users currentUser = usersRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String fullName = currentUser.getLastName() + ", " + currentUser.getFirstName() + " "
                + (currentUser.getMiddleName() == null ? "" : currentUser.getMiddleName());

        Logs log = new Logs();
        log.setUser(currentUser);
        log.setLogHeader(logHeader);
        log.setDescription(fullName + " " + description);
        log.setCreatedAt(LocalDateTime.now());

        logsRepository.save(log);
    }

    //READ & FILTER
    public Page<LogResponseDTO> getLogs(String logHeader, Pageable pageable){
        Specification<Logs> filters = Specification
                .where(LogsSpecification.hasLogHeader(logHeader));

        return logsRepository.findAll(filters, pageable)
                .map(logs -> {
                    LogResponseDTO logDTO = modelMapper.map(logs, LogResponseDTO.class);
                    String fullName = logs.getUser().getLastName() + ", " + logs.getUser().getFirstName() + " "
                            + (logs.getUser().getMiddleName() == null ? "" : logs.getUser().getMiddleName());
                    logDTO.setName(fullName);
                    return logDTO;
                });
    }
}
