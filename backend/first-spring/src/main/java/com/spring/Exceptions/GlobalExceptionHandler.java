package com.spring.Exceptions;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(EmptyDepartment.class)
    public ResponseEntity<ErrorResponse> handleEmptyDepartment(EmptyDepartment emptyDepartment){
     ErrorResponse error = new ErrorResponse(200, emptyDepartment.getMessage());
     return ResponseEntity.status(200).body(error);
    }

}
