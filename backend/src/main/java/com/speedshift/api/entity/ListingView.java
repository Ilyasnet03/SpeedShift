package com.speedshift.api.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "listing_views")
public class ListingView {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "viewed_at", nullable = false)
    private LocalDateTime viewedAt = LocalDateTime.now();

    protected ListingView() {}

    public ListingView(Long listingId, Long userId) {
        this.listingId = listingId;
        this.userId = userId;
    }

    public Long getId() { return id; }
    public Long getListingId() { return listingId; }
    public Long getUserId() { return userId; }
    public LocalDateTime getViewedAt() { return viewedAt; }
}
