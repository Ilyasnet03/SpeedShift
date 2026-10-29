package com.speedshift.api.controller;

import com.speedshift.api.dto.AdminDtos.DashboardStats;
import com.speedshift.api.dto.AdminDtos.EnabledUpdate;
import com.speedshift.api.dto.AdminDtos.ListingStatusUpdate;
import com.speedshift.api.dto.AdminDtos.ListingSummary;
import com.speedshift.api.dto.AdminDtos.ListingViewSummary;
import com.speedshift.api.dto.AdminDtos.RoleUpdate;
import com.speedshift.api.dto.AdminDtos.SiteVisitSummary;
import com.speedshift.api.repository.SiteVisitRepository;
import com.speedshift.api.repository.ListingViewRepository;
import org.springframework.data.domain.PageRequest;
import com.speedshift.api.dto.AdminDtos.UserSummary;
import com.speedshift.api.entity.User;
import com.speedshift.api.entity.User.Role;
import com.speedshift.api.service.AdminService;
import com.speedshift.api.service.AuditService;
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

    private final ListingViewRepository listingViewRepository;

    private final SiteVisitRepository siteVisitRepository;

    private final AuditService auditService;

    public AdminController(AdminService adminService, ListingViewRepository listingViewRepository, SiteVisitRepository siteVisitRepository, AuditService auditService) {
        this.adminService = adminService;
        this.listingViewRepository = listingViewRepository;
        this.siteVisitRepository = siteVisitRepository;
        this.auditService = auditService;
    }

    @GetMapping("/visits")
    public List<SiteVisitSummary> getSiteVisits() {
        return siteVisitRepository.findRecent(PageRequest.of(0, 500));
    }

    @GetMapping("/views")
    public List<ListingViewSummary> getListingViews() {
        return listingViewRepository.findRecent(PageRequest.of(0, 500));
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
        UserSummary result = adminService.setUserEnabled(id, request.enabled(), actor);
        auditService.log(actor, request.enabled() ? "USER_ENABLED" : "USER_DISABLED", "USER", id, result.email());
        return result;
    }

    @PatchMapping("/users/{id}/role")
    public UserSummary setUserRole(
        @PathVariable Long id,
        @Valid @RequestBody RoleUpdate request,
        @AuthenticationPrincipal User actor
    ) {
        UserSummary result = adminService.setUserRole(id, Role.valueOf(request.role()), actor);
        auditService.log(actor, "USER_ROLE", "USER", id, result.email() + " → " + request.role());
        return result;
    }

    @DeleteMapping("/users/{id}")
    public void deleteUser(@PathVariable Long id, @AuthenticationPrincipal User actor) {
        adminService.deleteUser(id, actor);
        auditService.log(actor, "USER_DELETED", "USER", id, null);
    }

    @GetMapping("/listings")
    public List<ListingSummary> getListings() {
        return adminService.getListings();
    }

    @PatchMapping("/listings/{id}/status")
    public ListingSummary setListingStatus(
        @PathVariable Long id,
        @Valid @RequestBody ListingStatusUpdate request,
        @AuthenticationPrincipal User actor
    ) {
        ListingSummary result = adminService.setListingStatus(id, request.status());
        auditService.log(actor, "LISTING_STATUS", "LISTING", id, result.title() + " → " + request.status());
        return result;
    }

    @DeleteMapping("/listings/{id}")
    public void deleteListing(@PathVariable Long id, @AuthenticationPrincipal User actor) {
        adminService.deleteListing(id);
        auditService.log(actor, "LISTING_DELETED", "LISTING", id, null);
    }
}
