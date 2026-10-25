package com.speedshift.api.dto;

public class AuthDtos {

    public record RegisterRequest(
        String firstName,
        String lastName,
        String email,
        String phone,
        String password
    ) {}

    public record LoginRequest(
        String email,
        String password
    ) {}

    public record AuthResponse(
        String token,
        String refreshToken,
        String email,
        String firstName,
        String lastName,
        String role
    ) {}
}
