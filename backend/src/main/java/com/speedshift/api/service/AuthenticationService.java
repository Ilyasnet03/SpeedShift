package com.speedshift.api.service;

import com.speedshift.api.dto.AuthDtos.AuthResponse;
import com.speedshift.api.dto.AuthDtos.LoginRequest;
import com.speedshift.api.dto.AuthDtos.RegisterRequest;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final String adminEmail;

    public AuthenticationService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtService jwtService,
        @Value("${ADMIN_EMAIL:}") String adminEmail
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.adminEmail = adminEmail;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Un compte existe déjà pour cet email");
        }

        User user = User.builder()
            .firstName(request.firstName())
            .lastName(request.lastName())
            .email(request.email())
            .phone(normalizeMoroccanPhone(request.phone()))
            .password(passwordEncoder.encode(request.password()))
            .role(User.Role.CLIENT)
            .enabled(true)
            .twoFactorEnabled(false)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        userRepository.save(user);
        promoteConfiguredAdmin(user);
        return issueTokens(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new IllegalArgumentException("Identifiants invalides"));
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
