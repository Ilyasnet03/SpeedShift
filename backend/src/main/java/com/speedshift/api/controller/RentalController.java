package com.speedshift.api.controller;

import com.speedshift.api.dto.RentalDtos.*;
import com.speedshift.api.entity.User;
import com.speedshift.api.service.RentalService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api")
public class RentalController {
    private final RentalService rentals;

    public RentalController(RentalService rentals) {
        this.rentals = rentals;
    }

    @GetMapping("/public/rentals")
    public List<VehicleResponse> available(@RequestParam(required = false) String city,
        @RequestParam(required = false) BigDecimal minPrice, @RequestParam(required = false) BigDecimal maxPrice,
        @RequestParam(required = false) String transmission) {
        return rentals.available(null, city, minPrice, maxPrice, transmission);
    }

    @GetMapping("/public/rental-agencies/{id}")
    public StoreResponse store(@PathVariable Long id) {
        return rentals.store(id);
    }

    @GetMapping("/public/rental-agencies")
    public List<AgencyResponse> agencies() {
        return rentals.publicAgencies();
    }

    @GetMapping("/agency")
    public AgencyResponse myAgency(@AuthenticationPrincipal User user) {
        return rentals.myAgency(user);
    }

    @PutMapping("/agency")
    public AgencyResponse saveAgency(@AuthenticationPrincipal User user, @Valid @RequestBody AgencyRequest request) {
        return rentals.saveAgency(user, request);
    }

    @GetMapping("/agency/vehicles")
    public List<VehicleResponse> mine(@AuthenticationPrincipal User user) {
        return rentals.mine(user);
    }

    @GetMapping("/agency/vehicle-quota")
    public VehicleQuota quota(@AuthenticationPrincipal User user) {
        return rentals.quota(user);
    }

    @PostMapping("/agency/vehicles")
    public VehicleResponse create(@AuthenticationPrincipal User user, @Valid @RequestBody VehicleRequest request) {
        return rentals.saveVehicle(user, null, request);
    }

    @PutMapping("/agency/vehicles/{id}")
    public VehicleResponse update(@AuthenticationPrincipal User user, @PathVariable Long id, @Valid @RequestBody VehicleRequest request) {
        return rentals.saveVehicle(user, id, request);
    }

    @DeleteMapping("/agency/vehicles/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User user, @PathVariable Long id) {
        rentals.deleteVehicle(user, id);
        return ResponseEntity.noContent().build();
    }
}
