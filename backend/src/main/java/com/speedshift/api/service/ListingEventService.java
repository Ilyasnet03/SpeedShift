package com.speedshift.api.service;

import com.speedshift.api.dto.FeatureDtos.ListingStats;
import com.speedshift.api.entity.Conversation;
import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.ListingEvent;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.ConversationRepository;
import com.speedshift.api.repository.ListingEventRepository;
import com.speedshift.api.repository.ListingRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ListingEventService {

    private final ListingEventRepository eventRepository;
    private final ListingRepository listingRepository;
    private final ConversationRepository conversationRepository;

    public ListingEventService(ListingEventRepository eventRepository, ListingRepository listingRepository, ConversationRepository conversationRepository) {
        this.eventRepository = eventRepository;
        this.listingRepository = listingRepository;
        this.conversationRepository = conversationRepository;
    }

    @Transactional
    public void recordView(Long listingId, Long sellerId, User viewer) {
        if (viewer != null && viewer.getId().equals(sellerId)) return;
        save(listingId, "VIEW");
        listingRepository.incrementViews(listingId);
    }

    @Transactional
    public void record(Long listingId, String type, User actor) {
        Listing listing = listingRepository.findById(listingId).orElse(null);
        if (listing == null || (actor != null && actor.getId().equals(listing.getSellerId()))) return;
        save(listingId, type);
    }

    public List<ListingStats> statsFor(User seller) {
        List<Long> ids = listingRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId()).stream().map(Listing::getId).toList();
        if (ids.isEmpty()) return List.of();
        Map<Long, Map<String, Long>> counts = new HashMap<>();
        for (Object[] row : eventRepository.countByListingAndType(ids)) {
            counts.computeIfAbsent((Long) row[0], key -> new HashMap<>()).put((String) row[1], (Long) row[2]);
        }
        Map<Long, Long> conversations = new HashMap<>();
        for (Conversation conversation : conversationRepository.findByBuyerIdOrSellerIdOrderByLastMessageAtDesc(-1L, seller.getId())) {
            conversations.merge(conversation.getListingId(), 1L, Long::sum);
        }
        return ids.stream().map(id -> {
            Map<String, Long> byType = counts.getOrDefault(id, Map.of());
            return new ListingStats(id, byType.getOrDefault("VIEW", 0L), byType.getOrDefault("WHATSAPP", 0L),
                byType.getOrDefault("CALL", 0L), byType.getOrDefault("SHARE", 0L), conversations.getOrDefault(id, 0L));
        }).toList();
    }

    private void save(Long listingId, String type) {
        eventRepository.save(ListingEvent.builder().listingId(listingId).eventType(type).createdAt(LocalDateTime.now()).build());
    }
}
