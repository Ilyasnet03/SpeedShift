package com.speedshift.api.entity;

import jakarta.persistence.*;

import java.time.LocalDate;

@Entity
@Table(name = "visitor_activity")
public class VisitorActivity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "visitor_id", nullable = false)
    private String visitorId;

    @Column(name = "user_id")
    private Long userId;

    @Column(nullable = false)
    private LocalDate day;

    @Column(nullable = false)
    private long seconds;

    protected VisitorActivity() {}

    public VisitorActivity(String visitorId, Long userId, LocalDate day) {
        this.visitorId = visitorId;
        this.userId = userId;
        this.day = day;
    }

    public void addSeconds(long value, Long currentUserId) {
        this.seconds += value;
        if (currentUserId != null) this.userId = currentUserId;
    }
}
