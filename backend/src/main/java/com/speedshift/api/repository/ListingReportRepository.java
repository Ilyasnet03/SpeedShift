package com.speedshift.api.repository;

import com.speedshift.api.entity.ListingReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ListingReportRepository extends JpaRepository<ListingReport, Long> {
    Optional<ListingReport> findByListingIdAndReporterId(Long listingId, Long reporterId);

    List<ListingReport> findAllByOrderByCreatedAtDesc();

    List<ListingReport> findByListingIdAndStatus(Long listingId, String status);
}
