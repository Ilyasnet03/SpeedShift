package com.speedshift.api.service;

import com.speedshift.api.entity.Conversation;
import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.Message;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.ConversationRepository;
import com.speedshift.api.repository.ListingRepository;
import com.speedshift.api.repository.MessageRepository;
import com.speedshift.api.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class MessagingServiceTest {
    private final ConversationRepository conversations = mock(ConversationRepository.class);
    private final MessageRepository messages = mock(MessageRepository.class);
    private final ListingRepository listings = mock(ListingRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final MessagingService service = new MessagingService(conversations, messages, listings, users);

    @Test
    void summaryIncludesListingAndParticipantRole() {
        User buyer = User.builder().id(1L).firstName("Buyer").lastName("B").build();
        User seller = User.builder().id(2L).firstName("Seller").lastName("S").build();
        Conversation conversation = Conversation.builder().id(10L).listingId(20L).buyerId(1L).sellerId(2L).lastMessageAt(LocalDateTime.now()).build();
        Listing listing = Listing.builder().id(20L).title("Moto").imageUrl("photo.jpg").price(new BigDecimal("1000")).status("sold").build();
        when(conversations.findByBuyerIdOrSellerIdOrderByLastMessageAtDesc(1L, 1L)).thenReturn(List.of(conversation));
        when(listings.findAllById(anyIterable())).thenReturn(List.of(listing));
        when(users.findAllById(anyIterable())).thenReturn(List.of(seller));
        when(messages.unreadByConversation(anyList(), eq(1L))).thenReturn(List.<Object[]>of(new Object[]{10L, 2L}));

        var result = service.list(buyer).get(0);
        assertTrue(result.buyer());
        assertEquals("photo.jpg", result.listingImageUrl());
        assertEquals(new BigDecimal("1000"), result.listingPrice());
        assertEquals("sold", result.listingStatus());
        assertEquals(2, result.unreadCount());
        assertFalse(result.listingDeleted());
    }

    @Test
    void openReturnsReadStatusAndRejectsNonParticipants() {
        User buyer = User.builder().id(1L).build();
        Conversation conversation = Conversation.builder().id(10L).listingId(20L).buyerId(1L).sellerId(2L).lastMessageAt(LocalDateTime.now()).build();
        LocalDateTime readAt = LocalDateTime.now();
        Message message = Message.builder().id(30L).conversationId(10L).senderId(1L).body("Bonjour").createdAt(readAt.minusMinutes(1)).readAt(readAt).build();
        when(conversations.findById(10L)).thenReturn(Optional.of(conversation));
        when(messages.findByConversationIdOrderByIdAsc(10L)).thenReturn(List.of(message));
        when(listings.findAllById(anyIterable())).thenReturn(List.of());
        when(users.findAllById(anyIterable())).thenReturn(List.of());
        when(messages.unreadByConversation(anyList(), eq(1L))).thenReturn(List.of());

        var detail = service.open(10L, buyer);
        assertEquals(readAt, detail.messages().get(0).readAt());
        assertTrue(detail.messages().get(0).mine());
        assertTrue(detail.conversation().listingDeleted());
        assertThrows(org.springframework.web.server.ResponseStatusException.class, () -> service.open(10L, User.builder().id(3L).build()));
        verify(messages).markRead(eq(10L), eq(1L), any(LocalDateTime.class));
    }
}
