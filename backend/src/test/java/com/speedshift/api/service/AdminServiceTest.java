package com.speedshift.api.service;

import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.User;
import com.speedshift.api.entity.User.Role;
import com.speedshift.api.repository.ListingRepository;
import com.speedshift.api.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ListingRepository listingRepository;

    @InjectMocks
    private AdminService adminService;

    @Test
    void preventsDisablingTheLastEnabledAdmin() {
        User admin = user(1L, Role.ADMIN, true);
        when(userRepository.findById(1L)).thenReturn(Optional.of(admin));
        when(userRepository.countByRoleAndEnabled(Role.ADMIN, true)).thenReturn(1L);

        assertThrows(IllegalArgumentException.class,
            () -> adminService.setUserEnabled(1L, false, user(2L, Role.ADMIN, true)));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void storesAdminListingStatusInLowercase() {
        Listing listing = Listing.builder()
            .id(7L)
            .title("Moto")
            .category("Moto")
            .brand("Yamaha")
            .price(BigDecimal.valueOf(42000))
            .status("pending")
            .build();
        when(listingRepository.findById(7L)).thenReturn(Optional.of(listing));
        when(listingRepository.save(any(Listing.class))).thenAnswer(invocation -> invocation.getArgument(0));

        adminService.setListingStatus(7L, "PUBLISHED");

        assertEquals("published", listing.getStatus());
    }

    private User user(Long id, Role role, boolean enabled) {
        return User.builder()
            .id(id)
            .email("admin" + id + "@example.com")
            .firstName("Admin")
            .lastName("User")
            .role(role)
            .enabled(enabled)
            .build();
    }
}
