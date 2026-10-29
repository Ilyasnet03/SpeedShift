package com.speedshift.api.controller;

import com.speedshift.api.dto.FeatureDtos.ConversationDetail;
import com.speedshift.api.dto.FeatureDtos.ConversationSummary;
import com.speedshift.api.dto.FeatureDtos.EventRequest;
import com.speedshift.api.dto.FeatureDtos.ListingStats;
import com.speedshift.api.dto.FeatureDtos.MessageRequest;
import com.speedshift.api.dto.FeatureDtos.ReportRequest;
import com.speedshift.api.dto.FeatureDtos.ReviewRequest;
import com.speedshift.api.dto.FeatureDtos.ReviewsResponse;
import com.speedshift.api.entity.User;
import com.speedshift.api.service.ListingEventService;
import com.speedshift.api.service.MessagingService;
import com.speedshift.api.service.ReportService;
import com.speedshift.api.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class EngagementController {

    private final ReviewService reviewService;
    private final ReportService reportService;
    private final ListingEventService eventService;
    private final MessagingService messagingService;

    public EngagementController(ReviewService reviewService, ReportService reportService,
                                ListingEventService eventService, MessagingService messagingService) {
        this.reviewService = reviewService;
        this.reportService = reportService;
        this.eventService = eventService;
        this.messagingService = messagingService;
    }

    @GetMapping("/sellers/{sellerId}/reviews")
    public ReviewsResponse getReviews(@PathVariable Long sellerId, @AuthenticationPrincipal User viewer) {
        return reviewService.getReviews(sellerId, viewer);
    }

    @PostMapping("/sellers/{sellerId}/reviews")
    public ReviewsResponse saveReview(@PathVariable Long sellerId, @Valid @RequestBody ReviewRequest request, @AuthenticationPrincipal User reviewer) {
        return reviewService.saveReview(sellerId, request, reviewer);
    }

    @DeleteMapping("/sellers/{sellerId}/reviews")
    public ReviewsResponse deleteReview(@PathVariable Long sellerId, @AuthenticationPrincipal User reviewer) {
        return reviewService.deleteReview(sellerId, reviewer);
    }

    @PostMapping("/listings/{id}/report")
    public ResponseEntity<Void> report(@PathVariable Long id, @Valid @RequestBody ReportRequest request, @AuthenticationPrincipal User reporter) {
        reportService.report(id, request, reporter);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/listings/{id}/events")
    public ResponseEntity<Void> recordEvent(@PathVariable Long id, @Valid @RequestBody EventRequest request, @AuthenticationPrincipal User actor) {
        eventService.record(id, request.type(), actor);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/listings/mine/stats")
    public List<ListingStats> myStats(@AuthenticationPrincipal User seller) {
        return eventService.statsFor(seller);
    }

    @GetMapping("/conversations")
    public List<ConversationSummary> conversations(@AuthenticationPrincipal User user) {
        return messagingService.list(user);
    }

    @GetMapping("/conversations/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal User user) {
        return Map.of("count", messagingService.unreadCount(user));
    }

    @GetMapping("/conversations/{id}")
    public ConversationDetail conversation(@PathVariable Long id, @AuthenticationPrincipal User user) {
        return messagingService.open(id, user);
    }

    @PostMapping("/conversations/{id}/messages")
    public ConversationDetail sendMessage(@PathVariable Long id, @Valid @RequestBody MessageRequest request, @AuthenticationPrincipal User user) {
        return messagingService.send(id, request.body(), user);
    }

    @PostMapping("/listings/{id}/conversations")
    public ConversationDetail startConversation(@PathVariable Long id, @Valid @RequestBody MessageRequest request, @AuthenticationPrincipal User buyer) {
        return messagingService.start(id, request.body(), buyer);
    }
}
