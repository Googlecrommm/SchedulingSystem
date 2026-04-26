package com.spring.Controller;

import com.spring.Service.LogsService;
import com.spring.dto.LogResponseDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class LogController {
    private final LogsService logsService;

    public LogController(LogsService logsService){
        this.logsService = logsService;
    }

    @GetMapping("getLogs")
    public Page<LogResponseDTO> getLogs(
            @RequestParam(required = false) String logHeader,
            Pageable pageable
    ){
        return logsService.getLogs(logHeader, pageable);
    }
}
