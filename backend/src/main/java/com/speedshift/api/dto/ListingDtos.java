package com.speedshift.api.dto;

import java.math.BigDecimal;
import java.util.List;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Map;

public class ListingDtos {

    public record CreateListingRequest(
        @NotBlank @Size(max = 255) String title,
        @NotBlank @Pattern(regexp = "Motos|Voitures|Jet Skis|Quads|Pièces & Accessoires") String category,
        @Size(max = 100) String subcategory,
        @NotBlank @Size(max = 100) String brand,
        @Size(max = 100) String model,
        @Min(1886) @Max(2100) Integer year,
        @Min(0) Integer mileage,
        @Size(max = 60) String fuel,
        @Size(max = 60) String transmission,
        @NotBlank @Size(max = 120) String city,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        @Size(max = 8000000) String imageUrl,
        @Size(max = 2000) String description
    ) {}

    public record ListingResponse(
        Long id,
        String title,
        String category,
        String subcategory,
        String brand,
        String model,
        Integer year,
        Integer mileage,
        String fuel,
        String transmission,
        String city,
        String countryCode,
        String imageUrl,
        String status,
        BigDecimal price,
        String sellerName,
        String sellerPhone,
        Boolean verified,
        BigDecimal sellerRating,
        Boolean featured,
        Integer views,
        java.time.LocalDateTime createdAt
    ) {}

    public record HomeResponse(
        List<ListingResponse> featured,
        List<ListingResponse> latest,
        List<CategorySummary> categories,
        MarketSummary summary
    ) {}

    public record CategorySummary(String name, String href, Integer count) {}

    public record MarketSummary(Integer listings, Integer activeUsers, Integer pendingModeration, String avgPrice) {}

    public record ListingDetailResponse(
        Long id,
        String title,
        String category,
        String subcategory,
        String brand,
        String model,
        Integer year,
        Integer mileage,
        String fuel,
        String transmission,
        String city,
        String countryCode,
        String imageUrl,
        String status,
        BigDecimal price,
        String sellerName,
        String sellerPhone,
        Boolean verified,
        BigDecimal sellerRating,
        Boolean featured,
        Integer views,
        String description,
        List<String> features,
        Map<String, String> specs
    ) {}

}
