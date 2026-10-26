package com.speedshift.api.service;

import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.User;
import com.speedshift.api.entity.User.Role;
import com.speedshift.api.repository.ListingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ListingServiceTest {

    @Mock
    private ListingRepository listingRepository;

    @InjectMocks
    private ListingService listingService;

    @Test
    void letsOwnerDeleteTheirListing() {
        User owner = user(7L, Role.CLIENT);
        Listing listing = Listing.builder().id(11L).sellerId(owner.getId()).build();
        when(listingRepository.findById(11L)).thenReturn(Optional.of(listing));

        listingService.deleteListing(11L, owner);

        verify(listingRepository).delete(listing);
    }

    @Test
    void preventsUserDeletingAnotherUsersListing() {
        Listing listing = Listing.builder().id(11L).sellerId(7L).build();
        when(listingRepository.findById(11L)).thenReturn(Optional.of(listing));

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
            () -> listingService.deleteListing(11L, user(8L, Role.CLIENT)));

        assertEquals(403, exception.getStatusCode().value());
        verify(listingRepository, never()).delete(listing);
    }

    @Test
    void letsAdministratorDeleteAnyListing() {
        Listing listing = Listing.builder().id(11L).sellerId(7L).build();
        when(listingRepository.findById(11L)).thenReturn(Optional.of(listing));

        listingService.deleteListing(11L, user(8L, Role.ADMIN));

        verify(listingRepository).delete(listing);
    }

    private User user(Long id, Role role) {
        return User.builder()
            .id(id)
            .email("user" + id + "@example.com")
            .firstName("Test")
            .lastName("User")
            .role(role)
            .enabled(true)
            .build();
    }
}
