package com.speedshift.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.Instant;
import java.util.List;

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
        LocalDateTime createdAt,
        Instant premiumUntil,
        boolean speedshiftCertified
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

    public record ListingViewSummary(
        Long id,
        Long listingId,
        String listingTitle,
        Long userId,
        String firstName,
        String lastName,
        String email,
        LocalDateTime viewedAt
    ) {}

    public record SiteVisitSummary(
        Long id,
        String visitorId,
        Long userId,
        String firstName,
        String lastName,
        String email,
        String path,
        String userAgent,
        LocalDateTime visitedAt
    ) {}

    public record SellerCount(String sellerName, long listings) {}

    public record AdminOverview(
        long reservedListings,
        long soldListings,
        long archivedListings,
        long expiredListings,
        long expiringSoonListings,
        long newListingsLast7Days,
        long newUsersLast7Days,
        long openReports,
        long totalReports,
        long conversations,
        long messages,
        long views30Days,
        long whatsapp30Days,
        long calls30Days,
        long shares30Days,
        List<SellerCount> topSellers
    ) {}

    public record UserActivity(
        Long userId,
        String firstName,
        String lastName,
        String email,
        Long totalSeconds,
        Long activeDays
    ) {}

    public record ActivityStats(
        long visitors,
        long averageSecondsPerVisitor,
        List<UserActivity> users
    ) {}

    public record EnabledUpdate(@NotNull Boolean enabled) {}

    public record PremiumUpdate(@NotNull Boolean active, Instant premiumUntil) {}

    public record CertificationUpdate(@NotNull Boolean certified) {}

    public record RentalVehicleLimitUpdate(@NotNull @Min(1) Integer limit) {}

    public record AgencyVehicleSummary(Long id, String title, String status, BigDecimal dailyPrice) {}

    public record AgencySummary(
        Long userId, String firstName, String lastName, String accountEmail, String accountPhone,
        boolean enabled, boolean emailVerified, LocalDateTime createdAt, int vehicleLimit,
        RentalDtos.AgencyResponse store, List<AgencyVehicleSummary> vehicles
    ) {}

    public record RoleUpdate(
        @NotBlank @Pattern(regexp = "CLIENT|ADMIN") String role
    ) {}

    public record ListingStatusUpdate(
        @NotBlank @Pattern(regexp = "PENDING|PUBLISHED|REJECTED|ARCHIVED") String status
    ) {}
}
