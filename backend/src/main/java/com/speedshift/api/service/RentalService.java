package com.speedshift.api.service;

import com.speedshift.api.dto.RentalDtos.*;
import com.speedshift.api.entity.RentalAgency;
import com.speedshift.api.entity.RentalVehicle;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.RentalAgencyRepository;
import com.speedshift.api.repository.RentalVehicleRepository;
import com.speedshift.api.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class RentalService {
    private final RentalAgencyRepository agencies;
    private final RentalVehicleRepository vehicles;
    private final UserRepository users;

    public RentalService(RentalAgencyRepository agencies, RentalVehicleRepository vehicles, UserRepository users) {
        this.agencies = agencies;
        this.vehicles = vehicles;
        this.users = users;
    }

    @Transactional(readOnly = true)
    public AgencyResponse myAgency(User user) {
        return agencyResponse(ownAgency(user));
    }

    @Transactional
    public AgencyResponse saveAgency(User user, AgencyRequest request) {
        requireAgency(user);
        RentalAgency agency = agencies.findByOwnerId(user.getId()).orElseGet(RentalAgency::new);
        agency.setOwner(user);
        agency.setName(request.name().trim());
        agency.setLogo(request.logo().trim());
        agency.setPhone(request.phone());
        agency.setEmail(request.email().trim());
        agency.setCity(request.city().trim());
        agency.setAddress(request.address().trim());
        agency.setDescription(request.description().trim());
        return agencyResponse(agencies.save(agency));
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> mine(User user) {
        requireAgency(user);
        return vehicles.findByAgencyOwnerIdOrderByCreatedAtDesc(user.getId()).stream().map(this::vehicleResponse).toList();
    }

    @Transactional(readOnly = true)
    public VehicleQuota quota(User user) {
        requireAgency(user);
        User current = users.findById(user.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable."));
        return new VehicleQuota(vehicles.countByAgencyOwnerId(user.getId()), current.getRentalVehicleLimit());
    }

    @Transactional
    public VehicleResponse saveVehicle(User user, Long id, VehicleRequest request) {
        if (id == null) {
            User locked = users.findByIdForUpdate(user.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Compte introuvable."));
            requireAgency(locked);
            if (vehicles.countByAgencyOwnerId(locked.getId()) >= locked.getRentalVehicleLimit()) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Limite de véhicules atteinte. Contactez un administrateur.");
            }
        }
        RentalAgency agency = ownAgency(user);
        RentalVehicle vehicle = id == null ? new RentalVehicle() : ownedVehicle(id, user);
        if (id == null) {
            vehicle.setAgency(agency);
            vehicle.setCreatedAt(LocalDateTime.now());
        }
        vehicle.setTitle(request.title().trim());
        vehicle.setBrand(request.brand().trim());
        vehicle.setModel(request.model().trim());
        vehicle.setYear(request.year());
        vehicle.setCategory(request.category().trim());
        vehicle.setDailyPrice(request.dailyPrice());
        vehicle.setFuel(request.fuel());
        vehicle.setTransmission(request.transmission());
        vehicle.setStatus(request.status());
        vehicle.getPhotos().clear();
        vehicle.getPhotos().addAll(request.photos());
        return vehicleResponse(vehicles.save(vehicle));
    }

    @Transactional
    public void deleteVehicle(User user, Long id) {
        vehicles.delete(ownedVehicle(id, user));
    }

    @Transactional(readOnly = true)
    public StoreResponse store(Long id) {
        RentalAgency agency = agencies.findById(id)
            .filter(a -> a.getOwner().isEnabled() && a.getOwner().getRole() == User.Role.AGENCY)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Agence introuvable."));
        return new StoreResponse(agencyResponse(agency), available(id, null, null, null, null));
    }

    @Transactional(readOnly = true)
    public List<VehicleResponse> available(Long agencyId, String city, BigDecimal min, BigDecimal max, String transmission) {
        if ((min != null && min.signum() < 0) || (max != null && max.signum() < 0)
            || (min != null && max != null && min.compareTo(max) > 0)
            || (transmission != null && !List.of("Manuelle", "Automatique").contains(transmission))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Filtres de location invalides.");
        }
        return vehicles.findAll((root, query, cb) -> {
            var agency = root.join("agency");
            var owner = agency.join("owner");
            List<Predicate> filters = new ArrayList<>();
            filters.add(cb.equal(root.get("status"), RentalVehicle.Status.ACTIVE));
            filters.add(cb.isTrue(owner.get("enabled")));
            filters.add(cb.equal(owner.get("role"), User.Role.AGENCY));
            if (agencyId != null) filters.add(cb.equal(agency.get("id"), agencyId));
            if (city != null && !city.isBlank()) filters.add(cb.equal(cb.lower(agency.get("city")), city.trim().toLowerCase(Locale.ROOT)));
            if (min != null) filters.add(cb.greaterThanOrEqualTo(root.get("dailyPrice"), min));
            if (max != null) filters.add(cb.lessThanOrEqualTo(root.get("dailyPrice"), max));
            if (transmission != null) filters.add(cb.equal(root.get("transmission"), transmission));
            return cb.and(filters.toArray(Predicate[]::new));
        }, Sort.by(Sort.Direction.DESC, "createdAt", "id")).stream().map(this::vehicleResponse).toList();
    }

    private void requireAgency(User user) {
        if (user == null || user.getRole() != User.Role.AGENCY || !user.isEnabled()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Compte agence requis.");
        }
    }

    private RentalAgency ownAgency(User user) {
        requireAgency(user);
        return agencies.findByOwnerId(user.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Configurez d'abord votre magasin."));
    }

    private RentalVehicle ownedVehicle(Long id, User user) {
        requireAgency(user);
        RentalVehicle vehicle = vehicles.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Véhicule introuvable."));
        if (!vehicle.getAgency().getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Ce véhicule appartient à une autre agence.");
        }
        return vehicle;
    }

    private AgencyResponse agencyResponse(RentalAgency agency) {
        return new AgencyResponse(agency.getId(), agency.getName(), agency.getLogo(), agency.getPhone(),
            agency.getEmail(), agency.getCity(), agency.getAddress(), agency.getDescription());
    }

    private VehicleResponse vehicleResponse(RentalVehicle vehicle) {
        return new VehicleResponse(vehicle.getId(), vehicle.getTitle(), vehicle.getBrand(), vehicle.getModel(),
            vehicle.getYear(), vehicle.getCategory(), vehicle.getDailyPrice(), vehicle.getFuel(),
            vehicle.getTransmission(), vehicle.getStatus(), List.copyOf(vehicle.getPhotos()), agencyResponse(vehicle.getAgency()));
    }
}
