package com.speedshift.api.service;

import com.speedshift.api.dto.FeatureDtos.AnalyticsResponse;
import com.speedshift.api.dto.FeatureDtos.DayCount;
import com.speedshift.api.dto.FeatureDtos.LabelCount;
import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.ListingEvent;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.ConversationRepository;
import com.speedshift.api.repository.ListingEventRepository;
import com.speedshift.api.repository.ListingReportRepository;
import com.speedshift.api.repository.ListingRepository;
import com.speedshift.api.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final ListingEventRepository eventRepository;
    private final ListingReportRepository reportRepository;
    private final ConversationRepository conversationRepository;

    public AnalyticsService(ListingRepository listingRepository, UserRepository userRepository, ListingEventRepository eventRepository,
                            ListingReportRepository reportRepository, ConversationRepository conversationRepository) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.eventRepository = eventRepository;
        this.reportRepository = reportRepository;
        this.conversationRepository = conversationRepository;
    }

    public AnalyticsResponse analytics(int requestedDays) {
        int days = Math.min(Math.max(requestedDays, 7), 180);
        LocalDate today = LocalDate.now();
        LocalDateTime since = today.minusDays(days - 1L).atStartOfDay();
        List<Listing> listings = listingRepository.findAll();
        List<ListingEvent> events = eventRepository.findByCreatedAtAfter(since);

        List<DayCount> listingsByDay = series(days, today, listings.stream().map(Listing::getCreatedAt).toList());
        List<DayCount> usersByDay = series(days, today, userRepository.findAll().stream().map(User::getCreatedAt).toList());
        List<DayCount> viewsByDay = series(days, today,
            events.stream().filter(event -> "VIEW".equals(event.getEventType())).map(ListingEvent::getCreatedAt).toList());

        long totalViews = events.stream().filter(event -> "VIEW".equals(event.getEventType())).count();
        long totalContacts = events.stream().filter(event -> "WHATSAPP".equals(event.getEventType()) || "CALL".equals(event.getEventType())).count();
        long openReports = reportRepository.findAll().stream().filter(report -> "OPEN".equals(report.getStatus())).count();

        return new AnalyticsResponse(days, listingsByDay, usersByDay, viewsByDay,
            count(listings, Listing::getCategory), count(listings, item -> item.getStatus() == null ? null : item.getStatus().toLowerCase(Locale.ROOT)),
            totalViews, totalContacts, openReports, conversationRepository.count());
    }

    private List<DayCount> series(int days, LocalDate today, List<LocalDateTime> timestamps) {
        Map<LocalDate, Long> buckets = new TreeMap<>();
        for (int i = days - 1; i >= 0; i--) buckets.put(today.minusDays(i), 0L);
        timestamps.stream().filter(value -> value != null).map(LocalDateTime::toLocalDate)
            .filter(buckets::containsKey).forEach(day -> buckets.merge(day, 1L, Long::sum));
        return buckets.entrySet().stream().map(entry -> new DayCount(entry.getKey().toString(), entry.getValue())).toList();
    }

    private List<LabelCount> count(List<Listing> listings, Function<Listing, String> classifier) {
        return listings.stream().map(classifier).filter(value -> value != null && !value.isBlank())
            .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
            .entrySet().stream()
            .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey(Comparator.naturalOrder())))
            .map(entry -> new LabelCount(entry.getKey(), entry.getValue())).toList();
    }
}
