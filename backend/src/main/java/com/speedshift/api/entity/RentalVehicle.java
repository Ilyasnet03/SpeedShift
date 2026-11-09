package com.speedshift.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rental_vehicles")
@Getter
@Setter
public class RentalVehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agency_id", nullable = false)
    private RentalAgency agency;
    @Column(nullable = false, length = 180)
    private String title;
    @Column(nullable = false, length = 100)
    private String brand;
    @Column(nullable = false, length = 100)
    private String model;
    @Column(name = "vehicle_year", nullable = false)
    private int year;
    @Column(nullable = false, length = 50)
    private String category;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal dailyPrice;
    @Column(nullable = false, length = 30)
    private String fuel;
    @Column(nullable = false, length = 30)
    private String transmission;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;
    @Column(nullable = false)
    private LocalDateTime createdAt;
    @ElementCollection
    @CollectionTable(name = "rental_vehicle_photos", joinColumns = @JoinColumn(name = "vehicle_id"))
    @OrderColumn(name = "photo_order")
    @Column(name = "url", nullable = false, length = 1000)
    private List<String> photos = new ArrayList<>();

    public enum Status { ACTIVE, RENTED, PAUSED }
}
