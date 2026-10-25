package com.speedshift.api.controller;

import com.speedshift.api.dto.ListingDtos.AdminSummary;
import com.speedshift.api.dto.ListingDtos.HomeResponse;
import com.speedshift.api.dto.ListingDtos.ListingDetailResponse;
import com.speedshift.api.dto.ListingDtos.ListingResponse;
import com.speedshift.api.service.ListingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("SpeedShift API is running");
    }

    @GetMapping("/home")
    public ResponseEntity<HomeResponse> home() {
        return ResponseEntity.ok(listingService.getHomePage());
    }

    @GetMapping("/listings")
    public ResponseEntity<List<ListingResponse>> getListings(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String query,
        @RequestParam(defaultValue = "featured") String sort
    ) {
        return ResponseEntity.ok(listingService.getListings(category, city, query, sort));
    }

    @GetMapping("/listings/{id}")
    public ResponseEntity<ListingDetailResponse> getListing(@PathVariable Long id) {
        return ResponseEntity.ok(listingService.getListingById(id));
    }

    @GetMapping("/admin/overview")
    public ResponseEntity<AdminSummary> adminOverview() {
        return ResponseEntity.ok(listingService.getAdminSummary());
    }
}
