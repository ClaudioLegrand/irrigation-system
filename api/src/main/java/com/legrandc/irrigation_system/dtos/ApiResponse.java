package com.legrandc.irrigation_system.dtos;

public class ApiResponse {
    private final String message;

    public ApiResponse(String message) {
        this.message = message;
    }

    public String getMessage() {
        return message;
    }
}
