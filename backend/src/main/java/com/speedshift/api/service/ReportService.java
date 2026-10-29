package com.speedshift.api.service;

import com.speedshift.api.dto.FeatureDtos.ReportRequest;
import com.speedshift.api.dto.FeatureDtos.ReportResolution;
import com.speedshift.api.dto.FeatureDtos.ReportSummary;
import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.ListingReport;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.ListingReportRepository;
import com.speedshift.api.repository.ListingRepository;
import com.speedshift.api.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReportService {

    private final ListingReportRepository reportRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    public ReportService(ListingReportRepository reportRepository, ListingRepository listingRepository, UserRepository userRepository) {
        this.reportRepository = reportRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void report(Long listingId, ReportRequest request, User reporter) {
        Listing listing = listingRepository.findById(listingId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Annonce introuvable."));
        if (reporter.getId().equals(listing.getSellerId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez pas signaler votre propre annonce.");
        }
        if (reportRepository.findByListingIdAndReporterId(listingId, reporter.getId()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Vous avez déjà signalé cette annonce.");
        }
        String details = request.details() == null || request.details().isBlank() ? null : request.details().trim();
        reportRepository.save(ListingReport.builder()
            .listingId(listingId)
            .reporterId(reporter.getId())
            .reason(request.reason())
            .details(details)
            .status("OPEN")
            .createdAt(LocalDateTime.now())
            .build());
    }

    public List<ReportSummary> getReports() {
        List<ListingReport> reports = reportRepository.findAllByOrderByCreatedAtDesc();
        Map<Long, Listing> listings = listingRepository.findAllById(reports.stream().map(ListingReport::getListingId).distinct().toList())
            .stream().collect(Collectors.toMap(Listing::getId, Function.identity()));
        Map<Long, User> reporters = userRepository.findAllById(reports.stream().map(ListingReport::getReporterId).distinct().toList())
            .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        return reports.stream().map(report -> toSummary(report, listings.get(report.getListingId()), reporters.get(report.getReporterId()))).toList();
    }

    @Transactional
    public ReportSummary resolve(Long id, ReportResolution resolution) {
        ListingReport report = reportRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Signalement introuvable."));
        Listing listing = listingRepository.findById(report.getListingId()).orElse(null);
        if (Boolean.TRUE.equals(resolution.archiveListing()) && listing != null) {
            listing.setStatus("archived");
            listing.setUpdatedAt(LocalDateTime.now());
            listingRepository.save(listing);
        }
        LocalDateTime now = LocalDateTime.now();
        // Tous les signalements ouverts sur la même annonce reçoivent la même décision.
        List<ListingReport> sameListing = reportRepository.findByListingIdAndStatus(report.getListingId(), "OPEN");
        if (!sameListing.contains(report)) sameListing = List.of(report);
        for (ListingReport item : sameListing) {
            item.setStatus(resolution.status());
            item.setResolvedAt(now);
            reportRepository.save(item);
        }
        return toSummary(report, listing, userRepository.findById(report.getReporterId()).orElse(null));
    }

    private ReportSummary toSummary(ListingReport report, Listing listing, User reporter) {
        return new ReportSummary(
            report.getId(), report.getListingId(),
            listing == null ? "(annonce supprimée)" : listing.getTitle(),
            listing == null ? null : listing.getStatus(),
            reporter == null ? null : reporter.getEmail(),
            report.getReason(), report.getDetails(), report.getStatus(),
            report.getCreatedAt(), report.getResolvedAt());
    }
}
