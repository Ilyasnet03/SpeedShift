package com.speedshift.api.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Map;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String from;
    private final String brevoApiKey;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final ObjectMapper mapper = new ObjectMapper();

    public EmailService(ObjectProvider<JavaMailSender> mailSender,
                        @Value("${app.mail-from:}") String from,
                        @Value("${app.brevo-api-key:}") String brevoApiKey) {
        this.mailSender = mailSender;
        this.from = from;
        this.brevoApiKey = brevoApiKey;
    }

    // Priorité à l'API HTTP Brevo (les hébergeurs gratuits bloquent le SMTP sortant), puis SMTP, puis logs.
    public void sendVerificationCode(String to, String firstName, String code) {
        String subject = "SpeedShift : votre code de vérification";
        String text = "Bonjour " + firstName + ",\n\n"
            + "Votre code de vérification SpeedShift est : " + code + "\n\n"
            + "Il est valable 15 minutes. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.\n\n"
            + "L'équipe SpeedShift";

        deliver(to, subject, text, "code de vérification = " + code);
    }

    public void sendListingExpiryReminder(String to, String firstName, String listingTitle, String renewUrl) {
        String subject = "SpeedShift : votre annonce expire bientôt";
        String text = "Bonjour " + firstName + ",\n\n"
            + "Votre annonce « " + listingTitle + " » expire dans moins de 3 jours.\n"
            + "Renouvelez-la en un clic depuis « Mes annonces » : " + renewUrl + "\n\n"
            + "L'équipe SpeedShift";
        deliver(to, subject, text, "rappel d'expiration pour « " + listingTitle + " »");
    }

    private void deliver(String to, String subject, String text, String logFallback) {
        if (!brevoApiKey.isBlank() && !from.isBlank()) {
            sendWithBrevoApi(to, subject, text);
            return;
        }
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || from.isBlank()) {
            log.warn("E-mail non configuré : {} (destinataire {})", logFallback, to);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        sender.send(message);
    }

    private void sendWithBrevoApi(String to, String subject, String text) {
        try {
            String body = mapper.writeValueAsString(Map.of(
                "sender", Map.of("name", "SpeedShift", "email", from),
                "to", List.of(Map.of("email", to)),
                "subject", subject,
                "textContent", text));
            HttpRequest request = HttpRequest.newBuilder(URI.create(BREVO_URL))
                .timeout(Duration.ofSeconds(15))
                .header("api-key", brevoApiKey)
                .header("Content-Type", "application/json")
                .header("accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 300) {
                throw new IllegalStateException("Brevo API " + response.statusCode() + " : " + response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(e);
        } catch (java.io.IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
