package com.speedshift.api.repository;

import com.speedshift.api.entity.ListingEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface ListingEventRepository extends JpaRepository<ListingEvent, Long> {

    @Query("select e.listingId, e.eventType, count(e) from ListingEvent e where e.listingId in :ids group by e.listingId, e.eventType")
    List<Object[]> countByListingAndType(@Param("ids") Collection<Long> ids);

    List<ListingEvent> findByCreatedAtAfter(LocalDateTime since);
}
