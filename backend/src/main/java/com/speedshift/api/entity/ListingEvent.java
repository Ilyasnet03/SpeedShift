package com.speedshift.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "listing_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ListingEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "listing_id", nullable = false)
    private Long listingId;

    @Column(name = "event_type", nullable = false, length = 20)
    private String eventType;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
