package com.speedshift.api.controller;

import com.speedshift.api.dto.AuthDtos.AuthResponse;
import com.speedshift.api.dto.AuthDtos.ForgotPasswordRequest;
import com.speedshift.api.dto.AuthDtos.LoginRequest;
import com.speedshift.api.dto.AuthDtos.PendingVerificationResponse;
import com.speedshift.api.dto.AuthDtos.RegisterRequest;
import com.speedshift.api.dto.AuthDtos.ResendCodeRequest;
import com.speedshift.api.dto.AuthDtos.ResetPasswordRequest;
import com.speedshift.api.dto.AuthDtos.VerifyEmailRequest;
import com.speedshift.api.service.AuthenticationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationService authenticationService;

    public AuthController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @PostMapping("/register")
    public ResponseEntity<PendingVerificationResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authenticationService.register(request));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<AuthResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ResponseEntity.ok(authenticationService.verifyEmail(request));
    }

    @PostMapping("/resend-code")
    public ResponseEntity<PendingVerificationResponse> resendCode(@Valid @RequestBody ResendCodeRequest request) {
        return ResponseEntity.ok(authenticationService.resendCode(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authenticationService.login(request));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authenticationService.requestPasswordReset(request);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authenticationService.resetPassword(request);
        return ResponseEntity.noContent().build();
    }
}
