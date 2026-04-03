package com.spring.Exceptions;

public class EmptyDepartment extends RuntimeException {
    public EmptyDepartment(String message) {
        super(message);
    }
}
