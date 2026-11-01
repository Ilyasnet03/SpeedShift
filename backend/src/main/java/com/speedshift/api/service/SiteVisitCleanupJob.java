package com.speedshift.api.service;

import com.speedshift.api.repository.SiteVisitRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class SiteVisitCleanupJob {

    private static final Logger log = LoggerFactory.getLogger(SiteVisitCleanupJob.class);

    private final SiteVisitRepository siteVisitRepository;

    public SiteVisitCleanupJob(SiteVisitRepository siteVisitRepository) {
        this.siteVisitRepository = siteVisitRepository;
    }

    // Le journal brut des visites est vidé : on ne garde que les 2 derniers jours.
    @Scheduled(cron = "0 30 3 * * *")
    public void purge() {
        int deleted = siteVisitRepository.deleteOlderThan(LocalDateTime.now().minusDays(2));
        log.info("Purge des visites : {} lignes supprimées", deleted);
    }
}
