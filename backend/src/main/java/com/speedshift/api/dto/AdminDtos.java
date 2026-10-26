package com.speedshift.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public final class AdminDtos {

    private AdminDtos() {}

    public record DashboardStats(
        long totalUsers,
        long activeUsers,
        long disabledUsers,
        long newUsersLast30Days,
        long totalListings,
        long publishedListings,
        long pendingListings,
        long rejectedListings,
        BigDecimal averagePublishedPrice
    ) {}

    public record UserSummary(
        Long id,
        String firstName,
        String lastName,
        String email,
        String phone,
        String role,
        boolean enabled,
        LocalDateTime createdAt
    ) {}

    public record ListingSummary(
        Long id,
        String title,
        String category,
        String brand,
        String model,
        String city,
        BigDecimal price,
        String sellerName,
        String sellerPhone,
        String status,
        String imageUrl,
        String description,
        LocalDateTime createdAt
    ) {}

    public record EnabledUpdate(@NotNull Boolean enabled) {}

    public record RoleUpdate(
        @NotBlank @Pattern(regexp = "CLIENT|ADMIN") String role
    ) {}

    public record ListingStatusUpdate(
        @NotBlank @Pattern(regexp = "PENDING|PUBLISHED|REJECTED|ARCHIVED") String status
    ) {}
}
