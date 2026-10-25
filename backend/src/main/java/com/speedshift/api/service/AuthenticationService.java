package com.speedshift.api.service;

import com.speedshift.api.dto.AuthDtos.AuthResponse;
import com.speedshift.api.dto.AuthDtos.LoginRequest;
import com.speedshift.api.dto.AuthDtos.RegisterRequest;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.UserRepository;
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

    public AuthenticationService(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Un compte existe déjà pour cet email");
        }

        User user = User.builder()
            .firstName(request.firstName())
            .lastName(request.lastName())
            .email(request.email())
            .phone(request.phone())
            .password(passwordEncoder.encode(request.password()))
            .role(User.Role.CLIENT)
            .enabled(true)
            .twoFactorEnabled(false)
            .createdAt(LocalDateTime.now())
            .updatedAt(LocalDateTime.now())
            .build();

        userRepository.save(user);

        return issueTokens(user);
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
            .orElseThrow(() -> new IllegalArgumentException("Identifiants invalides"));

        return issueTokens(user);
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
