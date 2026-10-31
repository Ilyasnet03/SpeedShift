package com.speedshift.api.service;

import com.speedshift.api.dto.AuthDtos.AuthResponse;
import com.speedshift.api.dto.AuthDtos.ForgotPasswordRequest;
import com.speedshift.api.dto.AuthDtos.LoginRequest;
import com.speedshift.api.dto.AuthDtos.PendingVerificationResponse;
import com.speedshift.api.dto.AuthDtos.RegisterRequest;
import com.speedshift.api.dto.AuthDtos.ResendCodeRequest;
import com.speedshift.api.dto.AuthDtos.ResetPasswordRequest;
import com.speedshift.api.dto.AuthDtos.VerifyEmailRequest;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
public class AuthenticationService {

    private static final Logger log = LoggerFactory.getLogger(AuthenticationService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MAX_ATTEMPTS = 5;
    private static final int RESEND_DELAY_SECONDS = 60;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final String adminEmail;

    public AuthenticationService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtService jwtService,
        EmailService emailService,
        @Value("${ADMIN_EMAIL:}") String adminEmail
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.emailService = emailService;
        this.adminEmail = adminEmail;
    }

    public PendingVerificationResponse register(RegisterRequest request) {
        User user = userRepository.findByEmail(request.email()).orElse(null);
        if (user != null && user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un compte existe déjà pour cet email");
        }
        if (user == null) {
            user = User.builder().email(request.email()).role(User.Role.CLIENT).enabled(true)
                .twoFactorEnabled(false).createdAt(LocalDateTime.now()).build();
        }
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhone(normalizeMoroccanPhone(request.phone()));
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setEmailVerified(false);
        user.setUpdatedAt(LocalDateTime.now());

        issueVerificationCode(user);
        return new PendingVerificationResponse(user.getEmail(), true);
    }

    public AuthResponse verifyEmail(VerifyEmailRequest request) {
        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code invalide"));
        if (user.isEmailVerified()) {
            return issueTokens(user);
        }
        if (user.getVerificationCode() == null || user.getVerificationExpiresAt() == null
            || user.getVerificationExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.GONE, "Code expiré");
        }
        if (user.getVerificationAttempts() >= MAX_ATTEMPTS) {
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Trop de tentatives");
        }
        if (!passwordEncoder.matches(request.code(), user.getVerificationCode())) {
            user.setVerificationAttempts(user.getVerificationAttempts() + 1);
            userRepository.save(user);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code invalide");
        }

        user.setEmailVerified(true);
        user.setVerificationCode(null);
        user.setVerificationExpiresAt(null);
        user.setVerificationAttempts(0);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        promoteConfiguredAdmin(user);
        return issueTokens(user);
    }

    public PendingVerificationResponse resendCode(ResendCodeRequest request) {
        User user = userRepository.findByEmail(request.email()).orElse(null);
        if (user != null && !user.isEmailVerified()) {
            if (user.getVerificationSentAt() != null
                && user.getVerificationSentAt().isAfter(LocalDateTime.now().minusSeconds(RESEND_DELAY_SECONDS))) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Patientez avant de redemander un code");
            }
            issueVerificationCode(user);
        }
        return new PendingVerificationResponse(request.email(), true);
    }

    public void requestPasswordReset(ForgotPasswordRequest request) {
        User user = userRepository.findByEmail(request.email()).orElse(null);
        if (user == null || !user.isEmailVerified()) {
            return;
        }
        if (user.getPasswordResetSentAt() != null
            && user.getPasswordResetSentAt().isAfter(LocalDateTime.now().minusSeconds(RESEND_DELAY_SECONDS))) {
            return;
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        user.setPasswordResetCode(passwordEncoder.encode(code));
        user.setPasswordResetExpiresAt(LocalDateTime.now().plusMinutes(15));
        user.setPasswordResetSentAt(LocalDateTime.now());
        user.setPasswordResetAttempts(0);
        userRepository.save(user);
        try {
            emailService.sendPasswordResetCode(user.getEmail(), user.getFirstName(), code);
        } catch (RuntimeException exception) {
            log.error("Échec de l'envoi du code de réinitialisation à {}", user.getEmail(), exception);
        }
    }

    public void resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByEmail(request.email())
            .filter(User::isEmailVerified)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code invalide"));
        if (user.getPasswordResetAttempts() >= MAX_ATTEMPTS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code invalide ou expiré");
        }
        if (user.getPasswordResetCode() == null || user.getPasswordResetExpiresAt() == null
            || user.getPasswordResetExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code invalide ou expiré");
        }
        if (!passwordEncoder.matches(request.code(), user.getPasswordResetCode())) {
            user.setPasswordResetAttempts(user.getPasswordResetAttempts() + 1);
            userRepository.save(user);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Code invalide");
        }

        user.setPassword(passwordEncoder.encode(request.password()));
        user.setPasswordResetCode(null);
        user.setPasswordResetExpiresAt(null);
        user.setPasswordResetAttempts(0);
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    private void issueVerificationCode(User user) {
        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        user.setVerificationCode(passwordEncoder.encode(code));
        user.setVerificationExpiresAt(LocalDateTime.now().plusMinutes(15));
        user.setVerificationSentAt(LocalDateTime.now());
        user.setVerificationAttempts(0);
        userRepository.save(user);
        try {
            emailService.sendVerificationCode(user.getEmail(), user.getFirstName(), code);
        } catch (RuntimeException exception) {
            log.error("Échec de l'envoi du code de vérification à {}", user.getEmail(), exception);
        }
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new IllegalArgumentException("Identifiants invalides"));
        if (!user.isEmailVerified()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED");
        }
        promoteConfiguredAdmin(user);
        return issueTokens(user);
    }

    private void promoteConfiguredAdmin(User user) {
        if (!adminEmail.isBlank()
            && adminEmail.equalsIgnoreCase(user.getEmail())
            && user.getRole() != User.Role.ADMIN) {
            user.setRole(User.Role.ADMIN);
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }
    }

    private String normalizeMoroccanPhone(String phone) {
        String digits = phone.replaceAll("[^0-9+]", "");
        if (digits.startsWith("0")) {
            return "+212" + digits.substring(1);
        }
        return digits;
    }

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtService.generateToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);
        return new AuthResponse(
            accessToken,
            refreshToken,
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getRole().name()
        );
    }
}
