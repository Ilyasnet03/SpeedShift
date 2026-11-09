package com.speedshift.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "rental_agencies")
@Getter
@Setter
public class RentalAgency {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false, unique = true)
    private User owner;

    @Column(nullable = false, length = 120)
    private String name;
    @Column(length = 1000)
    private String logo;
    @Column(nullable = false, length = 50)
    private String phone;
    @Column(nullable = false)
    private String email;
    @Column(nullable = false, length = 120)
    private String city;
    @Column(nullable = false)
    private String address;
    @Column(nullable = false, length = 2000)
    private String description;
}
