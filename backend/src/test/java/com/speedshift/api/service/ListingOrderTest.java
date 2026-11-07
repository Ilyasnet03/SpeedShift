package com.speedshift.api.service;

import com.speedshift.api.entity.Listing;
import com.speedshift.api.repository.ListingRepository;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

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

        assertEquals(List.of(2L, 3L, 1L), new ListingService(repository).getListings(null, null, null, "newest").stream().map(item -> item.id()).toList());
    }
}
