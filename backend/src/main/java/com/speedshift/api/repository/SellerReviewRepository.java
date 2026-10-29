package com.speedshift.api.repository;

import com.speedshift.api.entity.SellerReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SellerReviewRepository extends JpaRepository<SellerReview, Long> {
    List<SellerReview> findBySellerIdOrderByCreatedAtDesc(Long sellerId);

    Optional<SellerReview> findBySellerIdAndReviewerId(Long sellerId, Long reviewerId);

    @Query("select avg(r.rating) from SellerReview r where r.sellerId = :sellerId")
    Double averageRating(@Param("sellerId") Long sellerId);
}
