package com.speedshift.api.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "site_visits")
public class SiteVisit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "visitor_id", nullable = false)
    private String visitorId;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private String path;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "visited_at", nullable = false)
    private LocalDateTime visitedAt = LocalDateTime.now();

    protected SiteVisit() {}

    public SiteVisit(String visitorId, Long userId, String path, String userAgent) {
        this.visitorId = visitorId;
        this.userId = userId;
        this.path = path;
        this.userAgent = userAgent;
    }
}
