package com.speedshift.api.service;

import com.speedshift.api.dto.AdminDtos.DashboardStats;
import com.speedshift.api.dto.AdminDtos.ListingSummary;
import com.speedshift.api.dto.AdminDtos.UserSummary;
import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.User;
import com.speedshift.api.entity.User.Role;
import com.speedshift.api.repository.ListingRepository;
import com.speedshift.api.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    public AdminService(UserRepository userRepository, ListingRepository listingRepository) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
    }

    public DashboardStats getDashboardStats() {
        List<User> users = userRepository.findAll();
        List<Listing> listings = listingRepository.findAll();
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<Listing> published = listings.stream()
            .filter(listing -> hasStatus(listing, "PUBLISHED"))
            .toList();
        BigDecimal averagePrice = published.stream()
            .map(Listing::getPrice)
            .filter(price -> price != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .divide(BigDecimal.valueOf(Math.max(
                published.stream().filter(listing -> listing.getPrice() != null).count(), 1
            )), 2, RoundingMode.HALF_UP);

        return new DashboardStats(
            users.size(),
            users.stream().filter(User::isEnabled).count(),
            users.stream().filter(user -> !user.isEnabled()).count(),
            users.stream().filter(user -> user.getCreatedAt() != null && user.getCreatedAt().isAfter(thirtyDaysAgo)).count(),
            listings.size(),
            published.size(),
            listings.stream().filter(listing -> hasStatus(listing, "PENDING")).count(),
            listings.stream().filter(listing -> hasStatus(listing, "REJECTED")).count(),
            averagePrice
        );
    }

    public List<UserSummary> getUsers() {
        return userRepository.findAll().stream()
            .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(user -> new UserSummary(
                user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(),
                user.getPhone(), user.getRole().name(), user.isEnabled(), user.getCreatedAt()
            ))
            .toList();
    }

    @Transactional
    public UserSummary setUserEnabled(Long id, boolean enabled, User actor) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        if (!enabled && actor.getId().equals(user.getId())) {
            throw new IllegalArgumentException("An administrator cannot disable their own account");
        }
        if (!enabled && isLastEnabledAdmin(user)) {
            throw new IllegalArgumentException("The last active administrator cannot be disabled");
        }
        user.setEnabled(enabled);
        user.setUpdatedAt(LocalDateTime.now());
        return toUserSummary(userRepository.save(user));
    }

    @Transactional
    public UserSummary setUserRole(Long id, Role role, User actor) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + id));
        if (actor.getId().equals(user.getId()) && role != Role.ADMIN) {
            throw new IllegalArgumentException("An administrator cannot remove their own administrator role");
        }
        if (role != Role.ADMIN && isLastEnabledAdmin(user)) {
            throw new IllegalArgumentException("The last active administrator cannot be demoted");
        }
        user.setRole(role);
        user.setUpdatedAt(LocalDateTime.now());
        return toUserSummary(userRepository.save(user));
    }

    public List<ListingSummary> getListings() {
        return listingRepository.findAll().stream()
            .sorted(Comparator.comparing(Listing::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::toListingSummary)
            .toList();
    }

    @Transactional
    public void deleteListing(Long id) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Annonce introuvable."));
        listingRepository.delete(listing);
    }

    @Transactional
    public ListingSummary setListingStatus(Long id, String status) {
        Listing listing = listingRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Listing not found: " + id));
        listing.setStatus(status.toLowerCase(Locale.ROOT));
        listing.setUpdatedAt(LocalDateTime.now());
        return toListingSummary(listingRepository.save(listing));
    }

    private boolean isLastEnabledAdmin(User user) {
        return user.getRole() == Role.ADMIN
            && user.isEnabled()
            && userRepository.countByRoleAndEnabled(Role.ADMIN, true) <= 1;
    }

    private boolean hasStatus(Listing listing, String status) {
        return listing.getStatus() != null && listing.getStatus().equalsIgnoreCase(status);
    }

    private UserSummary toUserSummary(User user) {
        return new UserSummary(
            user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(),
            user.getPhone(), user.getRole().name(), user.isEnabled(), user.getCreatedAt()
        );
    }

    private ListingSummary toListingSummary(Listing listing) {
        return new ListingSummary(
            listing.getId(), listing.getTitle(), listing.getCategory(), listing.getBrand(),
            listing.getModel(), listing.getCity(), listing.getPrice(), listing.getSellerName(),
            listing.getSellerPhone(), listing.getStatus(), listing.getImageUrl(),
            listing.getDescription(), listing.getCreatedAt()
        );
    }
}
