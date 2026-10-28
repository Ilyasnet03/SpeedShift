package com.speedshift.api.repository;

import com.speedshift.api.dto.AdminDtos.ListingViewSummary;
import com.speedshift.api.entity.ListingView;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ListingViewRepository extends JpaRepository<ListingView, Long> {

    @Query("""
        select new com.speedshift.api.dto.AdminDtos$ListingViewSummary(
            v.id, l.id, l.title, u.id, u.firstName, u.lastName, u.email, v.viewedAt)
        from ListingView v, Listing l, User u
        where l.id = v.listingId and u.id = v.userId
        order by v.viewedAt desc
        """)
    List<ListingViewSummary> findRecent(Pageable pageable);
}
