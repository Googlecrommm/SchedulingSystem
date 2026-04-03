package com.spring.Exceptions;

public class NoChangesDetected extends RuntimeException{
    public NoChangesDetected(String message){
        super(message);
    }
}
