package com.speedshift.api.service;

import com.speedshift.api.dto.ListingDtos.AdminSummary;
import com.speedshift.api.dto.ListingDtos.CategorySummary;
import com.speedshift.api.dto.ListingDtos.HomeResponse;
import com.speedshift.api.dto.ListingDtos.ListingDetailResponse;
import com.speedshift.api.dto.ListingDtos.ListingResponse;
import com.speedshift.api.dto.ListingDtos.MarketSummary;
import com.speedshift.api.entity.Listing;
import com.speedshift.api.repository.ListingRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ListingService {

    private final ListingRepository listingRepository;

    public ListingService(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    public List<ListingResponse> getListings(String category, String city, String query, String sort) {
        List<Listing> listings = listingRepository.findAll().stream()
            .filter(item -> category == null || category.isBlank() || item.getCategory().equalsIgnoreCase(category))
            .filter(item -> city == null || city.isBlank() || item.getCity().equalsIgnoreCase(city))
            .filter(item -> query == null || query.isBlank() ||
                item.getTitle().toLowerCase().contains(query.toLowerCase()) ||
                item.getBrand().toLowerCase().contains(query.toLowerCase()) ||
                item.getModel().toLowerCase().contains(query.toLowerCase()) ||
                item.getDescription().toLowerCase().contains(query.toLowerCase()))
            .toList();

        Comparator<Listing> comparator = switch (sort == null ? "featured" : sort) {
            case "price_asc" -> Comparator.comparing(Listing::getPrice);
            case "price_desc" -> Comparator.comparing(Listing::getPrice).reversed();
            case "newest" -> Comparator.comparing(Listing::getCreatedAt).reversed();
            case "popular" -> Comparator.comparing(Listing::getViews).reversed();
            default -> Comparator.comparing(Listing::getFeatured, Comparator.nullsLast(Boolean::compareTo)).reversed();
        };

        return listings.stream()
            .sorted(comparator)
            .map(this::toResponse)
            .toList();
    }

    public ListingDetailResponse getListingById(Long id) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Listing not found: " + id));

        return new ListingDetailResponse(
            listing.getId(),
            listing.getTitle(),
            listing.getCategory(),
            listing.getSubcategory(),
            listing.getBrand(),
            listing.getModel(),
            listing.getYear(),
            listing.getMileage(),
            listing.getFuel(),
            listing.getTransmission(),
            listing.getCity(),
            listing.getCountryCode(),
            listing.getImageUrl(),
            listing.getStatus(),
            listing.getPrice(),
            listing.getSellerName(),
            listing.getSellerPhone(),
            listing.getVerified(),
            listing.getSellerRating(),
            listing.getFeatured(),
            listing.getViews(),
            listing.getDescription(),
            buildFeatures(listing),
            buildSpecs(listing)
        );
    }

    public HomeResponse getHomePage() {
        List<Listing> all = listingRepository.findAll();
        List<ListingResponse> featured = all.stream()
            .filter(item -> Boolean.TRUE.equals(item.getFeatured()))
            .sorted(Comparator.comparing(Listing::getCreatedAt).reversed())
            .limit(4)
            .map(this::toResponse)
            .toList();

        List<ListingResponse> latest = all.stream()
            .sorted(Comparator.comparing(Listing::getCreatedAt).reversed())
            .limit(6)
            .map(this::toResponse)
            .toList();

        List<CategorySummary> categories = List.of(
            new CategorySummary("Motos", "/catalog?category=Motos", 18),
            new CategorySummary("Voitures", "/catalog?category=Voitures", 22),
            new CategorySummary("Jet Skis", "/catalog?category=Jet-Skis", 10),
            new CategorySummary("Quads", "/catalog?category=Quads", 7),
            new CategorySummary("Pièces & Accessoires", "/catalog?category=Pièces", 15)
        );

        MarketSummary summary = new MarketSummary(
            all.size(),
            1842,
            21,
            "$" + all.stream().map(Listing::getPrice).reduce(BigDecimal.ZERO, BigDecimal::add).divide(BigDecimal.valueOf(Math.max(all.size(), 1)), 2, java.math.RoundingMode.HALF_UP)
        );

        return new HomeResponse(featured, latest, categories, summary);
    }

    public AdminSummary getAdminSummary() {
        List<Listing> all = listingRepository.findAll();
        long activeListings = all.stream().filter(item -> "published".equalsIgnoreCase(item.getStatus())).count();
        long pending = all.stream().filter(item -> "pending".equalsIgnoreCase(item.getStatus())).count();
        return new AdminSummary(1284L, activeListings, pending, 19L, 47L, "$1.84M");
    }

    private ListingResponse toResponse(Listing listing) {
        return new ListingResponse(
            listing.getId(),
            listing.getTitle(),
            listing.getCategory(),
            listing.getSubcategory(),
            listing.getBrand(),
            listing.getModel(),
            listing.getYear(),
            listing.getMileage(),
            listing.getFuel(),
            listing.getTransmission(),
            listing.getCity(),
            listing.getCountryCode(),
            listing.getImageUrl(),
            listing.getStatus(),
            listing.getPrice(),
            listing.getSellerName(),
            listing.getSellerPhone(),
            listing.getVerified(),
            listing.getSellerRating(),
            listing.getFeatured(),
            listing.getViews()
        );
    }

    private List<String> buildFeatures(Listing listing) {
        List<String> features = new ArrayList<>();
        if (listing.getFuel() != null) features.add(listing.getFuel());
        if (listing.getTransmission() != null) features.add(listing.getTransmission());
        if (listing.getYear() != null) features.add(listing.getYear() + " modèle");
        if (listing.getMileage() != null) features.add(String.format("%s km", listing.getMileage()));
        if (listing.getVerified() != null && listing.getVerified()) features.add("Vendeur vérifié");
        return features.isEmpty() ? List.of("À partir du prix demandé") : features;
    }

    private Map<String, String> buildSpecs(Listing listing) {
        return Map.of(
            "Catégorie", listing.getCategory(),
            "Marque", listing.getBrand(),
            "Modèle", listing.getModel() == null ? "-" : listing.getModel(),
            "Année", listing.getYear() == null ? "-" : String.valueOf(listing.getYear()),
            "Kilométrage", listing.getMileage() == null ? "-" : listing.getMileage() + " km",
            "Transmission", listing.getTransmission() == null ? "-" : listing.getTransmission(),
            "Carburant", listing.getFuel() == null ? "-" : listing.getFuel(),
            "Localisation", listing.getCity()
        );
    }
}
