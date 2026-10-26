package com.speedshift.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
        @NotBlank @Size(max = 120) String firstName,
        @NotBlank @Size(max = 120) String lastName,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Pattern(regexp = "(?:\\+212|0)[67][0-9]{8}") String phone,
        @NotBlank @Size(min = 8, max = 72) String password
    ) {}

    public record LoginRequest(
        @NotBlank @Email String email,
        @NotBlank String password
    ) {}

    public record AuthResponse(
        String token,
        String refreshToken,
        String email,
        String firstName,
        String lastName,
        String role
    ) {}

    public record PendingVerificationResponse(String email, boolean verificationRequired) {}

    public record VerifyEmailRequest(
        @NotBlank @Email String email,
        @NotBlank @Pattern(regexp = "[0-9]{6}") String code
    ) {}

    public record ResendCodeRequest(@NotBlank @Email String email) {}
}
