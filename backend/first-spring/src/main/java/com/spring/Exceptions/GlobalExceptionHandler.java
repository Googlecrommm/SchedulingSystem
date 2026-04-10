package com.spring.Exceptions;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    //EmptyDepartment Exception
    @ExceptionHandler(EmptyDepartment.class)
    public ResponseEntity<ErrorResponse> handleEmptyDepartment(EmptyDepartment emptyDepartment){
     ErrorResponse error = new ErrorResponse(200, emptyDepartment.getMessage());
     return ResponseEntity.status(200).body(error);
    }

    //NoChanges Exception
    @ExceptionHandler(NoChangesDetected.class)
    public ResponseEntity<ErrorResponse> handleNoChanges(NoChangesDetected noChangesDetected){
        ErrorResponse error = new ErrorResponse(400, noChangesDetected.getMessage());
        return ResponseEntity.status(400).body(error);
    }

    //NotFound Exceptions
    @ExceptionHandler(NotFound.class)
    public ResponseEntity<ErrorResponse> handleNotFound(NotFound notFound){
        ErrorResponse error = new ErrorResponse(404, notFound.getMessage());
        return ResponseEntity.status(404).body(error);
    }

}
