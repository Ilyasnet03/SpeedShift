package com.speedshift.api.controller;

import com.speedshift.api.dto.ListingDtos.CreateListingRequest;
import com.speedshift.api.dto.ListingDtos.HomeResponse;
import com.speedshift.api.dto.ListingDtos.ListingDetailResponse;
import com.speedshift.api.dto.ListingDtos.ListingResponse;
import com.speedshift.api.service.ListingService;
import com.speedshift.api.entity.User;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;

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

    @GetMapping("/listings/mine")
    public ResponseEntity<List<ListingResponse>> getMyListings(@AuthenticationPrincipal User seller) {
        return ResponseEntity.ok(listingService.getMyListings(seller));
    }

    @DeleteMapping("/listings/{id}")
    public ResponseEntity<Void> deleteOwnListing(
        @PathVariable Long id,
        @AuthenticationPrincipal User actor
    ) {
        listingService.deleteListing(id, actor);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/listings")
    public ResponseEntity<ListingResponse> createListing(
        @Valid @RequestBody CreateListingRequest request,
        @AuthenticationPrincipal User seller
    ) {
        return ResponseEntity.ok(listingService.createListing(request, seller));
    }

    @GetMapping("/listings/{id}")
    public ResponseEntity<ListingDetailResponse> getListing(@PathVariable Long id) {
        return ResponseEntity.ok(listingService.getListingById(id));
    }

    @GetMapping("/admin/listings/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ListingResponse>> pendingListings() {
        return ResponseEntity.ok(listingService.getPendingListings());
    }

    @PatchMapping("/admin/listings/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ListingResponse> publishListing(@PathVariable Long id) {
        return ResponseEntity.ok(listingService.publishListing(id));
    }
}
