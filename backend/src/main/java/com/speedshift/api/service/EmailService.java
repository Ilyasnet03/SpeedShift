package com.speedshift.api.service;

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

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String from;

    public EmailService(ObjectProvider<JavaMailSender> mailSender, @Value("${app.mail-from:}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    // Sans SMTP configuré (SPRING_MAIL_HOST), le code est écrit dans les logs pour les tests.
    public void sendVerificationCode(String to, String firstName, String code) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || from.isBlank()) {
            log.warn("SMTP non configuré : code de vérification pour {} = {}", to, code);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject("SpeedShift : votre code de vérification");
        message.setText("Bonjour " + firstName + ",\n\n"
            + "Votre code de vérification SpeedShift est : " + code + "\n\n"
            + "Il est valable 15 minutes. Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.\n\n"
            + "L'équipe SpeedShift");
        sender.send(message);
    }
}
