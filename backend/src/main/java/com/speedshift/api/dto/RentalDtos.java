package com.speedshift.api.dto;

import com.speedshift.api.entity.RentalVehicle.Status;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

public class RentalDtos {
    public record AgencyRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Size(max = 1000) String logo,
        @NotBlank @Pattern(regexp = "(?:\\+212|0)[567][0-9]{8}") String phone,
        @NotBlank @Email @Size(max = 255) String email,
        @NotBlank @Size(max = 120) String city,
        @NotBlank @Size(max = 255) String address,
        @NotBlank @Size(max = 2000) String description
    ) {}

    public record AgencyResponse(Long id, String name, String logo, String phone, String email,
        String city, String address, String description) {}

    public record VehicleRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 100) String brand,
        @NotBlank @Size(max = 100) String model,
        @NotNull @Min(1900) @Max(2100) Integer year,
        @NotBlank @Size(max = 50) String category,
        @NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal dailyPrice,
        @NotBlank @Pattern(regexp = "Diesel|Essence|Hybride|Électrique") String fuel,
        @NotBlank @Pattern(regexp = "Manuelle|Automatique") String transmission,
        @NotNull Status status,
        @NotEmpty @Size(max = 5) List<@NotBlank @Size(max = 1000) String> photos
    ) {}

    public record VehicleResponse(Long id, String title, String brand, String model, int year,
        String category, BigDecimal dailyPrice, String fuel, String transmission, Status status,
        List<String> photos, AgencyResponse agency) {}

    public record StoreResponse(AgencyResponse agency, List<VehicleResponse> vehicles) {}

    public record VehicleQuota(long count, int limit) {}
}
