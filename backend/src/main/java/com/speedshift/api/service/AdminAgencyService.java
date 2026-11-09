package com.speedshift.api.service;

import com.speedshift.api.dto.AdminDtos.AgencySummary;
import com.speedshift.api.dto.AdminDtos.AgencyVehicleSummary;
import com.speedshift.api.dto.RentalDtos.AgencyResponse;
import com.speedshift.api.entity.RentalAgency;
import com.speedshift.api.entity.RentalVehicle;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.RentalAgencyRepository;
import com.speedshift.api.repository.RentalVehicleRepository;
import com.speedshift.api.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class AdminAgencyService {
    private final UserRepository users;
    private final RentalAgencyRepository agencies;
    private final RentalVehicleRepository vehicles;

    public AdminAgencyService(UserRepository users, RentalAgencyRepository agencies, RentalVehicleRepository vehicles) {
        this.users = users;
        this.agencies = agencies;
        this.vehicles = vehicles;
    }

    @Transactional(readOnly = true)
    public List<AgencySummary> list() {
        Map<Long, RentalAgency> stores = agencies.findAll().stream()
            .collect(Collectors.toMap(a -> a.getOwner().getId(), Function.identity()));
        Map<Long, List<AgencyVehicleSummary>> byOwner = vehicles.findAll().stream()
            .collect(Collectors.groupingBy(v -> v.getAgency().getOwner().getId(),
                Collectors.mapping(this::vehicleSummary, Collectors.toList())));
        return users.findByRoleOrderByCreatedAtDesc(User.Role.AGENCY).stream()
            .map(user -> new AgencySummary(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(),
                user.getPhone(), user.isEnabled(), user.isEmailVerified(), user.getCreatedAt(),
                user.getRentalVehicleLimit(), storeResponse(stores.get(user.getId())),
                byOwner.getOrDefault(user.getId(), List.of())))
            .toList();
    }

    @Transactional
    public void setLimit(Long userId, int limit) {
        User user = users.findByIdForUpdate(userId)
            .filter(u -> u.getRole() == User.Role.AGENCY)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte agence introuvable."));
        user.setRentalVehicleLimit(limit);
        user.setUpdatedAt(java.time.LocalDateTime.now());
        users.save(user);
    }

    private AgencyResponse storeResponse(RentalAgency agency) {
        if (agency == null) return null;
        return new AgencyResponse(agency.getId(), agency.getName(), agency.getLogo(), agency.getPhone(),
            agency.getEmail(), agency.getCity(), agency.getAddress(), agency.getDescription());
    }

    private AgencyVehicleSummary vehicleSummary(RentalVehicle vehicle) {
        return new AgencyVehicleSummary(vehicle.getId(), vehicle.getTitle(), vehicle.getStatus().name(), vehicle.getDailyPrice());
    }
}
