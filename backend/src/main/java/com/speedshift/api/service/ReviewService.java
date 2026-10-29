package com.speedshift.api.service;

import com.speedshift.api.dto.FeatureDtos.ReviewItem;
import com.speedshift.api.dto.FeatureDtos.ReviewRequest;
import com.speedshift.api.dto.FeatureDtos.ReviewsResponse;
import com.speedshift.api.entity.SellerReview;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.ListingRepository;
import com.speedshift.api.repository.SellerReviewRepository;
import com.speedshift.api.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ReviewService {

    private final SellerReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ListingRepository listingRepository;

    public ReviewService(SellerReviewRepository reviewRepository, UserRepository userRepository, ListingRepository listingRepository) {
        this.reviewRepository = reviewRepository;
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
    }

    public ReviewsResponse getReviews(Long sellerId, User viewer) {
        List<SellerReview> reviews = reviewRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
        Map<Long, User> reviewers = userRepository.findAllById(reviews.stream().map(SellerReview::getReviewerId).toList())
            .stream().collect(Collectors.toMap(User::getId, Function.identity()));
        List<ReviewItem> items = reviews.stream()
            .map(review -> new ReviewItem(
                review.getId(),
                displayName(reviewers.get(review.getReviewerId())),
                review.getRating(),
                review.getComment(),
                review.getCreatedAt(),
                viewer != null && viewer.getId().equals(review.getReviewerId())))
            .toList();
        Double average = reviews.isEmpty() ? null
            : BigDecimal.valueOf(reviews.stream().mapToInt(SellerReview::getRating).average().orElse(0))
                .setScale(1, RoundingMode.HALF_UP).doubleValue();
        return new ReviewsResponse(average, reviews.size(), items);
    }

    @Transactional
    public ReviewsResponse saveReview(Long sellerId, ReviewRequest request, User reviewer) {
        if (reviewer.getId().equals(sellerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Vous ne pouvez pas vous noter vous-même.");
        }
        if (!userRepository.existsById(sellerId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendeur introuvable.");
        }
        LocalDateTime now = LocalDateTime.now();
        String comment = request.comment() == null || request.comment().isBlank() ? null : request.comment().trim();
        SellerReview review = reviewRepository.findBySellerIdAndReviewerId(sellerId, reviewer.getId())
            .orElseGet(() -> SellerReview.builder().sellerId(sellerId).reviewerId(reviewer.getId()).createdAt(now).build());
        review.setRating(request.rating());
        review.setComment(comment);
        review.setUpdatedAt(now);
        reviewRepository.save(review);

        Double average = reviewRepository.averageRating(sellerId);
        listingRepository.updateSellerRating(sellerId,
            BigDecimal.valueOf(average == null ? 0 : average).setScale(1, RoundingMode.HALF_UP));
        return getReviews(sellerId, reviewer);
    }

    @Transactional
    public ReviewsResponse deleteReview(Long sellerId, User reviewer) {
        reviewRepository.findBySellerIdAndReviewerId(sellerId, reviewer.getId()).ifPresent(reviewRepository::delete);
        Double average = reviewRepository.averageRating(sellerId);
        listingRepository.updateSellerRating(sellerId,
            BigDecimal.valueOf(average == null ? 0 : average).setScale(1, RoundingMode.HALF_UP));
        return getReviews(sellerId, reviewer);
    }

    private String displayName(User user) {
        if (user == null) return "Utilisateur";
        String last = user.getLastName() == null || user.getLastName().isBlank() ? "" : " " + user.getLastName().charAt(0) + ".";
        return user.getFirstName() + last;
    }
}
