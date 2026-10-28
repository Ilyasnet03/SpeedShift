package com.speedshift.api.controller;

import com.speedshift.api.entity.SiteVisit;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.SiteVisitRepository;
import jakarta.servlet.http.HttpServletRequest;
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

    private final SiteVisitRepository siteVisitRepository;

    public VisitController(SiteVisitRepository siteVisitRepository) {
        this.siteVisitRepository = siteVisitRepository;
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
