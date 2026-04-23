package com.spring.Exceptions;

public class ConflictingSchedule extends RuntimeException {
    public ConflictingSchedule(String message) {
        super(message);
    }
}
