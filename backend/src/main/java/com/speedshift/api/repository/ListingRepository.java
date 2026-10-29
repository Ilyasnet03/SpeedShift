package com.speedshift.api.repository;

import com.speedshift.api.entity.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {
    List<Listing> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    @Modifying
    @Query("update Listing l set l.sellerRating = :rating where l.sellerId = :sellerId")
    void updateSellerRating(@Param("sellerId") Long sellerId, @Param("rating") BigDecimal rating);

    @Modifying
    @Query("update Listing l set l.views = coalesce(l.views, 0) + 1 where l.id = :id")
    void incrementViews(@Param("id") Long id);

    @Query("""
        select l from Listing l
        where l.expiresAt between :from and :to
          and l.sellerId is not null
          and (l.expiryReminderSent is null or l.expiryReminderSent = false)
        """)
    List<Listing> findExpiringWithoutReminder(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
