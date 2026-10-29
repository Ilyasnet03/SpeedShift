package com.speedshift.api.repository;

import com.speedshift.api.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {
    Optional<Conversation> findByListingIdAndBuyerId(Long listingId, Long buyerId);

    List<Conversation> findByBuyerIdOrSellerIdOrderByLastMessageAtDesc(Long buyerId, Long sellerId);
}
