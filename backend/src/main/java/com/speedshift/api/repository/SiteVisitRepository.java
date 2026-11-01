package com.speedshift.api.repository;

import com.speedshift.api.dto.AdminDtos.SiteVisitSummary;
import com.speedshift.api.entity.SiteVisit;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SiteVisitRepository extends JpaRepository<SiteVisit, Long> {

    @Query("""
        select new com.speedshift.api.dto.AdminDtos$SiteVisitSummary(
            v.id, v.visitorId, u.id, u.firstName, u.lastName, u.email, v.path, v.userAgent, v.visitedAt)
        from SiteVisit v left join User u on u.id = v.userId
        order by v.visitedAt desc
        """)
    List<SiteVisitSummary> findRecent(Pageable pageable);

    @Modifying
    @Transactional
    @Query("delete from SiteVisit v where v.visitedAt < :before")
    int deleteOlderThan(@Param("before") LocalDateTime before);
}
