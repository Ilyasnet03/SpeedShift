package com.speedshift.api.service;

import com.speedshift.api.entity.Listing;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.ListingRepository;
import com.speedshift.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ListingExpiryReminderJob {

    private static final Logger log = LoggerFactory.getLogger(ListingExpiryReminderJob.class);

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final String frontendUrl;

    public ListingExpiryReminderJob(ListingRepository listingRepository, UserRepository userRepository, EmailService emailService,
                                    @Value("${app.frontend-url}") String frontendUrl) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.frontendUrl = frontendUrl;
    }

    @Scheduled(cron = "0 0 9 * * *")
    public void sendReminders() {
        LocalDateTime now = LocalDateTime.now();
        for (Listing listing : listingRepository.findExpiringWithoutReminder(now, now.plusDays(3))) {
            if (!"published".equalsIgnoreCase(listing.getStatus())) continue;
            User seller = userRepository.findById(listing.getSellerId()).orElse(null);
            // Marquée avant l'envoi : un e-mail en échec ne doit pas être renvoyé en boucle chaque jour.
            listing.setExpiryReminderSent(true);
            listingRepository.save(listing);
            if (seller == null) continue;
            try {
                emailService.sendListingExpiryReminder(seller.getEmail(), seller.getFirstName(), listing.getTitle(), frontendUrl + "/my-listings");
            } catch (RuntimeException exception) {
                log.warn("Rappel d'expiration non envoyé pour l'annonce {} : {}", listing.getId(), exception.getMessage());
            }
        }
    }
}
