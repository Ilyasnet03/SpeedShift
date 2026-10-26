package com.speedshift.api.service;

import com.speedshift.api.dto.ListingDtos.CategorySummary;
import com.speedshift.api.dto.ListingDtos.CreateListingRequest;
import com.speedshift.api.dto.ListingDtos.HomeResponse;
import com.speedshift.api.dto.ListingDtos.ListingDetailResponse;
import com.speedshift.api.dto.ListingDtos.ListingResponse;
import com.speedshift.api.dto.ListingDtos.MarketSummary;
import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.ListingRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
public class ListingService {

    private final ListingRepository listingRepository;

    public ListingService(ListingRepository listingRepository) {
        this.listingRepository = listingRepository;
    }

    public List<ListingResponse> getListings(String category, String city, String query, String sort) {
        List<Listing> listings = listingRepository.findAll().stream()
            .filter(item -> "published".equalsIgnoreCase(item.getStatus()))
            .filter(item -> category == null || category.isBlank() || item.getCategory().equalsIgnoreCase(category))
            .filter(item -> city == null || city.isBlank() || (item.getCity() != null && item.getCity().equalsIgnoreCase(city)))
            .filter(item -> query == null || query.isBlank() ||
                containsIgnoreCase(item.getTitle(), query) ||
                containsIgnoreCase(item.getBrand(), query) ||
                containsIgnoreCase(item.getModel(), query) ||
                containsIgnoreCase(item.getDescription(), query))
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

    public List<ListingResponse> getMyListings(User seller) {
        return listingRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId()).stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public void deleteListing(Long id, User actor) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Annonce introuvable."));
        if (actor.getRole() != User.Role.ADMIN && !actor.getId().equals(listing.getSellerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez supprimer que vos propres annonces.");
        }
        listingRepository.delete(listing);
    }

    public ListingResponse createListing(CreateListingRequest request, User seller) {
        LocalDateTime now = LocalDateTime.now();
        Listing listing = Listing.builder()
            .title(request.title().trim())
            .category(request.category().trim())
            .subcategory(request.subcategory())
            .brand(request.brand().trim())
            .model(request.model())
            .year(request.year())
            .mileage(request.mileage())
            .fuel(request.fuel())
            .transmission(request.transmission())
            .city(request.city().trim())
            .countryCode("MA")
            .imageUrl(request.imageUrl())
            .thumbnailUrl(null)
            .price(request.price())
            .status("pending")
            .sellerName((seller.getFirstName() + " " + seller.getLastName()).trim())
            .sellerPhone(seller.getPhone())
            .sellerId(seller.getId())
            .verified(false)
            .sellerRating(BigDecimal.ZERO)
            .views(0)
            .featured(false)
            .description(request.description())
            .createdAt(now)
            .updatedAt(now)
            .build();

        return toResponse(listingRepository.save(listing));
    }

    public List<ListingResponse> getPendingListings() {
        return listingRepository.findAll().stream()
            .filter(item -> "pending".equalsIgnoreCase(item.getStatus()))
            .sorted(Comparator.comparing(Listing::getCreatedAt).reversed())
            .map(this::toResponse)
            .toList();
    }

    public ListingResponse publishListing(Long id) {
        Listing listing = listingRepository.findById(id)
            .filter(item -> "pending".equalsIgnoreCase(item.getStatus()))
            .orElseThrow(() -> new IllegalArgumentException("Pending listing not found: " + id));
        listing.setStatus("published");
        listing.setUpdatedAt(LocalDateTime.now());
        return toResponse(listingRepository.save(listing));
    }

    public ListingDetailResponse getListingById(Long id) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Listing not found: " + id));
        if (!"published".equalsIgnoreCase(listing.getStatus())) {
            throw new IllegalArgumentException("Listing not found: " + id);
        }

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
            .filter(item -> "published".equalsIgnoreCase(item.getStatus()))
            .filter(item -> Boolean.TRUE.equals(item.getFeatured()))
            .sorted(Comparator.comparing(Listing::getCreatedAt).reversed())
            .limit(4)
            .map(this::toResponse)
            .toList();

        List<ListingResponse> latest = all.stream()
            .filter(item -> "published".equalsIgnoreCase(item.getStatus()))
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
            all.stream().map(Listing::getPrice).filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(Math.max(all.stream().filter(item -> item.getPrice() != null).count(), 1)), 2, RoundingMode.HALF_UP)
                .toPlainString() + " DH"
        );

        return new HomeResponse(featured, latest, categories, summary);
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

    private boolean containsIgnoreCase(String value, String query) {
        return value != null && value.toLowerCase().contains(query.toLowerCase());
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
