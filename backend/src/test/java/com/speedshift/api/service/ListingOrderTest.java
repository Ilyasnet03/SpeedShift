package com.speedshift.api.service;

import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.ListingRepository;
import com.speedshift.api.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class ListingOrderTest {
    @Test
    void newestSortOrdersAllVisibleListingsByCreationDate() {
        ListingRepository repository = mock(ListingRepository.class);
        Listing oldest = Listing.builder().id(1L).status("published").createdAt(LocalDateTime.of(2024, 1, 1, 0, 0)).build();
        Listing newest = Listing.builder().id(2L).status("published").createdAt(LocalDateTime.of(2026, 1, 1, 0, 0)).build();
        Listing middle = Listing.builder().id(3L).status("published").createdAt(LocalDateTime.of(2025, 1, 1, 0, 0)).build();
        when(repository.findAll()).thenReturn(List.of(oldest, newest, middle));

        assertEquals(List.of(2L, 3L, 1L), new ListingService(repository, mock(UserRepository.class)).getListings(null, null, null, "newest").stream().map(item -> item.id()).toList());
    }

    @Test
    void listingDetailUsesCurrentCertificationEvenWhenPremiumHasExpired() {
        ListingRepository repository = mock(ListingRepository.class);
        UserRepository users = mock(UserRepository.class);
        Listing item = listing(1L, 3L, 2024, 100, 1, false);
        User seller = User.builder().id(3L).speedshiftCertified(true).premiumUntil(Instant.now().minusSeconds(1)).build();
        when(repository.findById(1L)).thenReturn(Optional.of(item));
        when(users.findById(3L)).thenReturn(Optional.of(seller));

        var detail = new ListingService(repository, users).getListingById(1L);
        assertEquals(true, detail.sellerCertified());
        assertEquals(false, detail.sellerPremium());
    }

    @Test
    void premiumSellersComeFirstForEverySortAndExpiredPremiumDoesNot() {
        ListingRepository repository = mock(ListingRepository.class);
        UserRepository users = mock(UserRepository.class);
        User premium = User.builder().id(1L).premiumUntil(Instant.now().plusSeconds(3600)).speedshiftCertified(true).build();
        User expired = User.builder().id(2L).premiumUntil(Instant.now().minusSeconds(1)).build();
        Listing boosted = listing(1L, 1L, 2020, 900, 1, false);
        Listing regular = listing(2L, 2L, 2025, 100, 100, true);
        Listing unowned = listing(3L, null, 2024, 500, 10, true);
        when(repository.findAll()).thenReturn(List.of(regular, unowned, boosted));
        when(users.findAllById(any())).thenReturn(List.of(premium, expired));
        ListingService service = new ListingService(repository, users);

        for (String sort : List.of("newest", "price_asc", "price_desc", "popular", "featured")) {
            var results = service.getListings(null, null, null, sort);
            assertEquals(1L, results.get(0).id(), sort);
            assertEquals(true, results.get(0).sellerPremium());
            assertEquals(true, results.get(0).sellerCertified());
            assertEquals(false, results.stream().filter(item -> item.id().equals(2L)).findFirst().orElseThrow().sellerPremium());
        }
        assertEquals(List.of(1L, 2L, 3L), service.getListings(null, null, null, "price_asc").stream().map(item -> item.id()).toList());
        assertEquals(1L, service.getHomePage().latest().get(0).id());
        assertEquals(1L, service.getHomePage().featured().get(0).id());
    }

    private Listing listing(Long id, Long sellerId, int year, int price, int views, boolean featured) {
        return Listing.builder().id(id).sellerId(sellerId).status("published")
            .createdAt(LocalDateTime.of(year, 1, 1, 0, 0)).price(BigDecimal.valueOf(price))
            .views(views).featured(featured).build();
    }
}
