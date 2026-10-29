package com.speedshift.api.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "listings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String category;

    private String subcategory;

    private String brand;

    private String model;

    private Integer year;
    private Integer mileage;
    private String fuel;
    private String transmission;
    private String city;
    private String countryCode;
    private String conditionField;
    @Column(columnDefinition = "TEXT")
    private String imageUrl;
    private String thumbnailUrl;

    @Column(nullable = false)
    private BigDecimal price;

    private Integer enginePower;
    private Integer engineDisplacement;
    private String status;
    private String availability;
    private String sellerName;
    private String sellerPhone;
    private Long sellerId;
    private Boolean verified;
    private BigDecimal sellerRating;
    private Integer views;
    private Boolean featured;
    private LocalDateTime expiresAt;
    private Boolean expiryReminderSent;
    private Boolean showPhone;

    @Column(length = 2000)
    private String description;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
