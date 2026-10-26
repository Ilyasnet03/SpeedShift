package com.speedshift.api.controller;

import com.speedshift.api.dto.AdminDtos.DashboardStats;
import com.speedshift.api.dto.AdminDtos.EnabledUpdate;
import com.speedshift.api.dto.AdminDtos.ListingStatusUpdate;
import com.speedshift.api.dto.AdminDtos.ListingSummary;
import com.speedshift.api.dto.AdminDtos.RoleUpdate;
import com.speedshift.api.dto.AdminDtos.UserSummary;
import com.speedshift.api.entity.User;
import com.speedshift.api.entity.User.Role;
import com.speedshift.api.service.AdminService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/stats")
    public DashboardStats getDashboardStats() {
        return adminService.getDashboardStats();
    }

    @GetMapping("/users")
    public List<UserSummary> getUsers() {
        return adminService.getUsers();
    }

    @PatchMapping("/users/{id}/enabled")
    public UserSummary setUserEnabled(
        @PathVariable Long id,
        @Valid @RequestBody EnabledUpdate request,
        @AuthenticationPrincipal User actor
    ) {
        return adminService.setUserEnabled(id, request.enabled(), actor);
    }

    @PatchMapping("/users/{id}/role")
    public UserSummary setUserRole(
        @PathVariable Long id,
        @Valid @RequestBody RoleUpdate request,
        @AuthenticationPrincipal User actor
    ) {
        return adminService.setUserRole(id, Role.valueOf(request.role()), actor);
    }

    @GetMapping("/listings")
    public List<ListingSummary> getListings() {
        return adminService.getListings();
    }

    @PatchMapping("/listings/{id}/status")
    public ListingSummary setListingStatus(
        @PathVariable Long id,
        @Valid @RequestBody ListingStatusUpdate request
    ) {
        return adminService.setListingStatus(id, request.status());
    }
}
