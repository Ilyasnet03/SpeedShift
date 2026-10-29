package com.speedshift.api.controller;

import com.speedshift.api.dto.FeatureDtos.AnalyticsResponse;
import com.speedshift.api.dto.FeatureDtos.AuditEntry;
import com.speedshift.api.dto.FeatureDtos.ReportResolution;
import com.speedshift.api.dto.FeatureDtos.ReportSummary;
import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.ListingRepository;
import com.speedshift.api.repository.UserRepository;
import com.speedshift.api.service.AnalyticsService;
import com.speedshift.api.service.AuditService;
import com.speedshift.api.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminInsightsController {

    private final ReportService reportService;
    private final AnalyticsService analyticsService;
    private final AuditService auditService;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    public AdminInsightsController(ReportService reportService, AnalyticsService analyticsService, AuditService auditService,
                                   UserRepository userRepository, ListingRepository listingRepository) {
        this.reportService = reportService;
        this.analyticsService = analyticsService;
        this.auditService = auditService;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
    }

    @GetMapping("/reports")
    public List<ReportSummary> reports() {
        return reportService.getReports();
    }

    @PatchMapping("/reports/{id}")
    public ReportSummary resolveReport(@PathVariable Long id, @Valid @RequestBody ReportResolution resolution, @AuthenticationPrincipal User admin) {
        ReportSummary summary = reportService.resolve(id, resolution);
        auditService.log(admin, "REPORT_" + resolution.status(), "REPORT", id,
            "Annonce #" + summary.listingId() + (Boolean.TRUE.equals(resolution.archiveListing()) ? " archivée" : ""));
        return summary;
    }

    @GetMapping("/analytics")
    public AnalyticsResponse analytics(@RequestParam(defaultValue = "30") int days) {
        return analyticsService.analytics(days);
    }

    @GetMapping("/audit")
    public List<AuditEntry> audit(@RequestParam(defaultValue = "200") int limit) {
        return auditService.recent(limit);
    }

    @GetMapping("/export/users.csv")
    public ResponseEntity<byte[]> exportUsers(@AuthenticationPrincipal User admin) {
        String header = "id,prenom,nom,email,telephone,role,actif,cree_le";
        String body = userRepository.findAll().stream()
            .sorted(Comparator.comparing(User::getId))
            .map(user -> csvRow(user.getId(), user.getFirstName(), user.getLastName(), user.getEmail(), user.getPhone(),
                user.getRole(), user.isEnabled(), user.getCreatedAt()))
            .collect(Collectors.joining("\n"));
        auditService.log(admin, "EXPORT_USERS", "USER", null, null);
        return csv("speedshift-utilisateurs.csv", header, body);
    }

    @GetMapping("/export/listings.csv")
    public ResponseEntity<byte[]> exportListings(@AuthenticationPrincipal User admin) {
        String header = "id,titre,categorie,marque,modele,annee,ville,prix,statut,vendeur,vues,cree_le,expire_le";
        String body = listingRepository.findAll().stream()
            .sorted(Comparator.comparing(Listing::getId))
            .map(item -> csvRow(item.getId(), item.getTitle(), item.getCategory(), item.getBrand(), item.getModel(), item.getYear(),
                item.getCity(), item.getPrice(), item.getStatus(), item.getSellerName(), item.getViews(), item.getCreatedAt(), item.getExpiresAt()))
            .collect(Collectors.joining("\n"));
        auditService.log(admin, "EXPORT_LISTINGS", "LISTING", null, null);
        return csv("speedshift-annonces.csv", header, body);
    }

    private ResponseEntity<byte[]> csv(String filename, String header, String body) {
        String content = "\uFEFF" + header + "\n" + body + (body.isEmpty() ? "" : "\n");
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
            .body(content.getBytes(StandardCharsets.UTF_8));
    }

    private String csvRow(Object... values) {
        return Stream.of(values).map(this::csvCell).collect(Collectors.joining(","));
    }

    // Neutralise les formules (=, +, -, @) interprétées par Excel dans les valeurs saisies par les utilisateurs.
    private String csvCell(Object value) {
        if (value == null) return "";
        String text = String.valueOf(value);
        if (!text.isEmpty() && "=+-@\t\r".indexOf(text.charAt(0)) >= 0 && !(value instanceof Number)) {
            text = "'" + text;
        }
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }
}
