package com.spring.Exceptions;

public class NotAllowed extends RuntimeException {
    public NotAllowed(String message) {
        super(message);
    }
}
