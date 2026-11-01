package com.speedshift.api.service;

import com.speedshift.api.dto.AdminDtos.AdminOverview;
import com.speedshift.api.dto.AdminDtos.SellerCount;
import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.ListingEvent;
import com.speedshift.api.repository.ConversationRepository;
import com.speedshift.api.repository.ListingEventRepository;
import com.speedshift.api.repository.ListingReportRepository;
import com.speedshift.api.repository.ListingRepository;
import com.speedshift.api.repository.MessageRepository;
import com.speedshift.api.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminOverviewService {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final ListingReportRepository reportRepository;
    private final ListingEventRepository eventRepository;
    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;

    public AdminOverviewService(ListingRepository listingRepository, UserRepository userRepository,
                                ListingReportRepository reportRepository, ListingEventRepository eventRepository,
                                ConversationRepository conversationRepository, MessageRepository messageRepository) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.reportRepository = reportRepository;
        this.eventRepository = eventRepository;
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
    }

    public AdminOverview getOverview() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime weekAgo = now.minusDays(7);
        List<Listing> listings = listingRepository.findAll();
        Map<String, Long> events = eventRepository.findByCreatedAtAfter(now.minusDays(30)).stream()
            .collect(Collectors.groupingBy(ListingEvent::getEventType, Collectors.counting()));
        List<SellerCount> topSellers = listings.stream()
            .filter(listing -> listing.getSellerName() != null && !listing.getSellerName().isBlank())
            .collect(Collectors.groupingBy(Listing::getSellerName, Collectors.counting()))
            .entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue(Comparator.reverseOrder()))
            .limit(5)
            .map(entry -> new SellerCount(entry.getKey(), entry.getValue()))
            .toList();
        List<Listing> live = listings.stream().filter(listing -> hasStatus(listing, "published")).toList();

        return new AdminOverview(
            count(listings, "reserved"),
            count(listings, "sold"),
            count(listings, "archived"),
            live.stream().filter(listing -> listing.getExpiresAt() != null && listing.getExpiresAt().isBefore(now)).count(),
            live.stream().filter(listing -> listing.getExpiresAt() != null && listing.getExpiresAt().isAfter(now)
                && listing.getExpiresAt().isBefore(now.plusDays(3))).count(),
            listings.stream().filter(listing -> listing.getCreatedAt() != null && listing.getCreatedAt().isAfter(weekAgo)).count(),
            userRepository.findAll().stream().filter(user -> user.getCreatedAt() != null && user.getCreatedAt().isAfter(weekAgo)).count(),
            reportRepository.findAll().stream().filter(report -> "OPEN".equalsIgnoreCase(report.getStatus())).count(),
            reportRepository.count(),
            conversationRepository.count(),
            messageRepository.count(),
            events.getOrDefault("VIEW", 0L),
            events.getOrDefault("WHATSAPP", 0L),
            events.getOrDefault("CALL", 0L),
            events.getOrDefault("SHARE", 0L),
            topSellers
        );
    }

    private static boolean hasStatus(Listing listing, String status) {
        return status.equalsIgnoreCase(listing.getStatus());
    }

    private static long count(List<Listing> listings, String status) {
        return listings.stream().filter(listing -> hasStatus(listing, status)).count();
    }
}
