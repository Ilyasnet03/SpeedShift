package com.speedshift.api.controller;

import com.speedshift.api.entity.SiteVisit;
import com.speedshift.api.entity.User;
import com.speedshift.api.entity.VisitorActivity;
import com.speedshift.api.repository.SiteVisitRepository;
import com.speedshift.api.repository.VisitorActivityRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class VisitController {

    public record VisitRequest(String visitorId, String path) {}

    public record HeartbeatRequest(String visitorId, Integer seconds) {}

    private final SiteVisitRepository siteVisitRepository;

    private final VisitorActivityRepository activityRepository;

    public VisitController(SiteVisitRepository siteVisitRepository, VisitorActivityRepository activityRepository) {
        this.siteVisitRepository = siteVisitRepository;
        this.activityRepository = activityRepository;
    }

    @PostMapping("/heartbeat")
    @Transactional
    public ResponseEntity<Void> heartbeat(@RequestBody HeartbeatRequest request, @AuthenticationPrincipal User user) {
        if (request.visitorId() == null || request.visitorId().isBlank() || request.visitorId().length() > 64 || request.seconds() == null) {
            return ResponseEntity.badRequest().build();
        }
        long seconds = Math.min(Math.max(request.seconds(), 1), 60);
        LocalDate today = LocalDate.now();
        VisitorActivity activity = activityRepository.findByVisitorIdAndDay(request.visitorId(), today)
            .orElseGet(() -> new VisitorActivity(request.visitorId(), null, today));
        activity.addSeconds(seconds, user != null ? user.getId() : null);
        activityRepository.save(activity);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/visits")
    public ResponseEntity<Void> track(
        @RequestBody VisitRequest request,
        @AuthenticationPrincipal User user,
        HttpServletRequest http
    ) {
        if (request.visitorId() == null || request.visitorId().isBlank() || request.visitorId().length() > 64
            || request.path() == null || request.path().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        String agent = http.getHeader("User-Agent");
        siteVisitRepository.save(new SiteVisit(
            request.visitorId(),
            user != null ? user.getId() : null,
            truncate(request.path(), 255),
            agent == null ? null : truncate(agent, 255)
        ));
        return ResponseEntity.noContent().build();
    }

    private static String truncate(String value, int max) {
        return value.length() > max ? value.substring(0, max) : value;
    }
}
