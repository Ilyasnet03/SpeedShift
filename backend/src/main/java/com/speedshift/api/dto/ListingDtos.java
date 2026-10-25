package com.speedshift.api.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class ListingDtos {

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
        Integer views
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

    public record AdminSummary(
        Long users,
        Long activeListings,
        Long pending,
        Long openReports,
        Long messages,
        String revenue
    ) {}
}
