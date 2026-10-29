package com.speedshift.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

public final class FeatureDtos {

    private FeatureDtos() {}

    public record ReviewRequest(
        @NotNull @Min(1) @Max(5) Integer rating,
        @Size(max = 1000) String comment
    ) {}

    public record ReviewItem(Long id, String reviewerName, Integer rating, String comment, LocalDateTime createdAt, boolean mine) {}

    public record ReviewsResponse(Double average, int count, List<ReviewItem> reviews) {}

    public record ReportRequest(
        @NotBlank @Pattern(regexp = "SCAM|FAKE|INAPPROPRIATE|DUPLICATE|SOLD|OTHER") String reason,
        @Size(max = 1000) String details
    ) {}

    public record ReportSummary(
        Long id,
        Long listingId,
        String listingTitle,
        String listingStatus,
        String reporterEmail,
        String reason,
        String details,
        String status,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt
    ) {}

    public record ReportResolution(
        @NotBlank @Pattern(regexp = "RESOLVED|DISMISSED") String status,
        Boolean archiveListing
    ) {}

    public record EventRequest(@NotBlank @Pattern(regexp = "WHATSAPP|CALL|SHARE") String type) {}

    public record ListingStats(Long listingId, long views, long whatsapp, long calls, long shares, long messages) {}

    public record MessageRequest(@NotBlank @Size(max = 2000) String body) {}

    public record ConversationSummary(
        Long id,
        Long listingId,
        String listingTitle,
        String otherUserName,
        String lastMessage,
        LocalDateTime lastMessageAt,
        long unreadCount
    ) {}

    public record MessageItem(Long id, Long senderId, String body, LocalDateTime createdAt, boolean mine) {}

    public record ConversationDetail(ConversationSummary conversation, List<MessageItem> messages) {}

    public record AuditEntry(
        Long id,
        String adminEmail,
        String action,
        String targetType,
        Long targetId,
        String details,
        LocalDateTime createdAt
    ) {}

    public record DayCount(String date, long count) {}

    public record LabelCount(String label, long count) {}

    public record AnalyticsResponse(
        int days,
        List<DayCount> listingsByDay,
        List<DayCount> usersByDay,
        List<DayCount> viewsByDay,
        List<LabelCount> listingsByCategory,
        List<LabelCount> listingsByStatus,
        long totalViews,
        long totalContacts,
        long openReports,
        long totalConversations
    ) {}
}
