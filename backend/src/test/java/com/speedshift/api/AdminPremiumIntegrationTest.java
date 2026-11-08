package com.speedshift.api;

import com.speedshift.api.entity.User;
import com.speedshift.api.repository.UserRepository;
import com.speedshift.api.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;

import java.sql.DriverManager;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:premiumtest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;NON_KEYWORDS=YEAR",
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdminPremiumIntegrationTest {
    @Autowired private MockMvc mvc;
    @Autowired private UserRepository users;
    @Autowired private JwtService jwt;

    @Test
    void onlyAdminCanManagePremiumAndCertificationAndChangesPersist() throws Exception {
        User admin = createUser("premium-admin@example.test", User.Role.ADMIN);
        User client = createUser("premium-client@example.test", User.Role.CLIENT);
        String adminToken = "Bearer " + jwt.generateToken(admin);
        String clientToken = "Bearer " + jwt.generateToken(client);
        String premiumPath = "/api/admin/users/" + client.getId() + "/premium";
        String certificationPath = "/api/admin/users/" + client.getId() + "/certification";
        Instant expiry = Instant.now().plus(1, ChronoUnit.DAYS).truncatedTo(ChronoUnit.SECONDS);
        String payload = "{\"active\":true,\"premiumUntil\":\"" + expiry + "\"}";

        mvc.perform(patch(premiumPath).contentType(MediaType.APPLICATION_JSON).content(payload)).andExpect(status().isUnauthorized());
        mvc.perform(patch(premiumPath).header("Authorization", clientToken).contentType(MediaType.APPLICATION_JSON).content(payload)).andExpect(status().isForbidden());
        mvc.perform(patch(certificationPath).header("Authorization", clientToken).contentType(MediaType.APPLICATION_JSON).content("{\"certified\":true}")).andExpect(status().isForbidden());
        mvc.perform(patch(premiumPath).header("Authorization", adminToken).contentType(MediaType.APPLICATION_JSON).content("{}")).andExpect(status().isBadRequest());
        mvc.perform(patch(premiumPath).header("Authorization", adminToken).contentType(MediaType.APPLICATION_JSON).content(payload)).andExpect(status().isOk());
        mvc.perform(patch(certificationPath).header("Authorization", adminToken).contentType(MediaType.APPLICATION_JSON).content("{\"certified\":true}")).andExpect(status().isOk());
        User persisted = users.findById(client.getId()).orElseThrow();
        assertEquals(expiry, persisted.getPremiumUntil());
        assertEquals(true, persisted.isSpeedshiftCertified());
        mvc.perform(patch(premiumPath).header("Authorization", adminToken).contentType(MediaType.APPLICATION_JSON).content("{\"active\":false,\"premiumUntil\":null}")).andExpect(status().isOk());
        assertEquals(null, users.findById(client.getId()).orElseThrow().getPremiumUntil());
        assertEquals(true, users.findById(client.getId()).orElseThrow().isSpeedshiftCertified());
    }

    @Test
    void migrationAddsDisabledFieldsToExistingAccounts() throws Exception {
        try (var connection = DriverManager.getConnection("jdbc:h2:mem:premium_migration;MODE=PostgreSQL")) {
            try (var statement = connection.createStatement()) {
                statement.execute("CREATE TABLE users (id BIGINT PRIMARY KEY)");
                statement.execute("INSERT INTO users (id) VALUES (1)");
            }
            new ResourceDatabasePopulator(new ClassPathResource("db/migration/V16__seller_premium_and_certification.sql")).populate(connection);
            try (var statement = connection.createStatement();
                 var result = statement.executeQuery("SELECT premium_until, speedshift_certified FROM users WHERE id = 1")) {
                result.next();
                assertEquals(null, result.getObject(1));
                assertEquals(false, result.getBoolean(2));
            }
        }
    }

    private User createUser(String email, User.Role role) {
        LocalDateTime now = LocalDateTime.now();
        return users.save(User.builder().email(email).password("unused").firstName("Test").lastName("User")
            .role(role).enabled(true).emailVerified(true).createdAt(now).updatedAt(now).build());
    }
}
