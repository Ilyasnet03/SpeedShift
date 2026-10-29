package com.speedshift.api.service;

import com.speedshift.api.dto.FeatureDtos.ConversationDetail;
import com.speedshift.api.dto.FeatureDtos.ConversationSummary;
import com.speedshift.api.dto.FeatureDtos.MessageItem;
import com.speedshift.api.entity.Conversation;
import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.Message;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.ConversationRepository;
import com.speedshift.api.repository.ListingRepository;
import com.speedshift.api.repository.MessageRepository;
import com.speedshift.api.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class MessagingService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    public MessagingService(ConversationRepository conversationRepository, MessageRepository messageRepository,
                            ListingRepository listingRepository, UserRepository userRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ConversationDetail start(Long listingId, String body, User buyer) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Annonce introuvable."));
        if (listing.getSellerId() == null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ce vendeur ne peut pas être contacté par message.");
        }
        if (listing.getSellerId().equals(buyer.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez pas vous écrire à vous-même.");
        }
        LocalDateTime now = LocalDateTime.now();
        Conversation conversation = conversationRepository.findByListingIdAndBuyerId(listingId, buyer.getId())
            .orElseGet(() -> conversationRepository.save(Conversation.builder()
                .listingId(listingId).buyerId(buyer.getId()).sellerId(listing.getSellerId())
                .createdAt(now).lastMessageAt(now).build()));
        addMessage(conversation, buyer, body);
        return detail(conversation, buyer);
    }

    @Transactional
    public ConversationDetail send(Long conversationId, String body, User sender) {
        Conversation conversation = participantConversation(conversationId, sender);
        addMessage(conversation, sender, body);
        return detail(conversation, sender);
    }

    @Transactional
    public ConversationDetail open(Long conversationId, User viewer) {
        Conversation conversation = participantConversation(conversationId, viewer);
        messageRepository.markRead(conversationId, viewer.getId(), LocalDateTime.now());
        return detail(conversation, viewer);
    }

    public List<ConversationSummary> list(User user) {
        List<Conversation> conversations = conversationRepository.findByBuyerIdOrSellerIdOrderByLastMessageAtDesc(user.getId(), user.getId());
        return summaries(conversations, user);
    }

    public long unreadCount(User user) {
        List<Conversation> conversations = conversationRepository.findByBuyerIdOrSellerIdOrderByLastMessageAtDesc(user.getId(), user.getId());
        if (conversations.isEmpty()) return 0;
        return messageRepository.unreadByConversation(conversations.stream().map(Conversation::getId).toList(), user.getId())
            .stream().mapToLong(row -> (Long) row[1]).sum();
    }

    private Conversation participantConversation(Long id, User user) {
        Conversation conversation = conversationRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation introuvable."));
        if (!user.getId().equals(conversation.getBuyerId()) && !user.getId().equals(conversation.getSellerId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation introuvable.");
        }
        return conversation;
    }

    private void addMessage(Conversation conversation, User sender, String body) {
        String text = body == null ? "" : body.trim();
        if (text.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le message est vide.");
        }
        LocalDateTime now = LocalDateTime.now();
        messageRepository.save(Message.builder()
            .conversationId(conversation.getId()).senderId(sender.getId()).body(text).createdAt(now).build());
        conversation.setLastMessageAt(now);
        conversationRepository.save(conversation);
    }

    private ConversationDetail detail(Conversation conversation, User viewer) {
        List<MessageItem> messages = messageRepository.findByConversationIdOrderByIdAsc(conversation.getId()).stream()
            .map(message -> new MessageItem(message.getId(), message.getSenderId(), message.getBody(), message.getCreatedAt(),
                message.getSenderId().equals(viewer.getId())))
            .toList();
        return new ConversationDetail(summaries(List.of(conversation), viewer).get(0), messages);
    }

    private List<ConversationSummary> summaries(List<Conversation> conversations, User viewer) {
        if (conversations.isEmpty()) return List.of();
        Map<Long, Listing> listings = listingRepository.findAllById(conversations.stream().map(Conversation::getListingId).distinct().toList())
            .stream().collect(Collectors.toMap(Listing::getId, Function.identity()));
        List<Long> otherIds = conversations.stream()
            .map(item -> item.getBuyerId().equals(viewer.getId()) ? item.getSellerId() : item.getBuyerId()).distinct().toList();
        Map<Long, User> others = userRepository.findAllById(otherIds).stream().collect(Collectors.toMap(User::getId, Function.identity()));
        Map<Long, Long> unread = new HashMap<>();
        for (Object[] row : messageRepository.unreadByConversation(conversations.stream().map(Conversation::getId).toList(), viewer.getId())) {
            unread.put((Long) row[0], (Long) row[1]);
        }
        return conversations.stream().map(item -> {
            Long otherId = item.getBuyerId().equals(viewer.getId()) ? item.getSellerId() : item.getBuyerId();
            User other = others.get(otherId);
            Listing listing = listings.get(item.getListingId());
            Message last = messageRepository.findFirstByConversationIdOrderByIdDesc(item.getId());
            return new ConversationSummary(
                item.getId(), item.getListingId(),
                listing == null ? "(annonce supprimée)" : listing.getTitle(),
                other == null ? "Utilisateur" : (other.getFirstName() + " " + initial(other.getLastName())).trim(),
                last == null ? "" : last.getBody(),
                item.getLastMessageAt(),
                unread.getOrDefault(item.getId(), 0L));
        }).toList();
    }

    private String initial(String lastName) {
        return lastName == null || lastName.isBlank() ? "" : lastName.charAt(0) + ".";
    }
}
