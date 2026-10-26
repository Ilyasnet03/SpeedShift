package com.speedshift.api.repository;

import com.speedshift.api.entity.Listing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingRepository extends JpaRepository<Listing, Long> {
    List<Listing> findBySellerIdOrderByCreatedAtDesc(Long sellerId);
}
