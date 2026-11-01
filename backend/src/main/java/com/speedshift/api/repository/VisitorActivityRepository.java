package com.speedshift.api.repository;

import com.speedshift.api.dto.AdminDtos.UserActivity;
import com.speedshift.api.entity.VisitorActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VisitorActivityRepository extends JpaRepository<VisitorActivity, Long> {

    Optional<VisitorActivity> findByVisitorIdAndDay(String visitorId, LocalDate day);

    @Query("select coalesce(sum(a.seconds), 0) from VisitorActivity a where a.day between :from and :to")
    long totalSeconds(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("select count(distinct a.visitorId) from VisitorActivity a where a.day between :from and :to")
    long countVisitors(@Param("from") LocalDate from, @Param("to") LocalDate to);

    @Query("""
        select new com.speedshift.api.dto.AdminDtos$UserActivity(
            u.id, u.firstName, u.lastName, u.email, sum(a.seconds), count(distinct a.day))
        from VisitorActivity a join User u on u.id = a.userId
        where a.day between :from and :to
        group by u.id, u.firstName, u.lastName, u.email
        order by sum(a.seconds) desc
        """)
    List<UserActivity> perUser(@Param("from") LocalDate from, @Param("to") LocalDate to);
}
