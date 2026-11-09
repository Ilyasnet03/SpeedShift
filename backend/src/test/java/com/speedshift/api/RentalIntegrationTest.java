package com.speedshift.api;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.speedshift.api.entity.User;
import com.speedshift.api.repository.UserRepository;
import com.speedshift.api.service.EmailService;
import com.speedshift.api.service.JwtService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.sql.DriverManager;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:rentaltest;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;NON_KEYWORDS=YEAR,DAY",
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RentalIntegrationTest {
    @Autowired private MockMvc mvc;
    @Autowired private UserRepository users;
    @Autowired private JwtService jwt;
    @Autowired private ObjectMapper json;
    @MockBean private EmailService emailService;

    @Test
    void registrationOnlyAssignsAgencyRoleWhenRequested() throws Exception {
        String base = "\"firstName\":\"A\",\"lastName\":\"B\",\"phone\":\"+212612345678\",\"password\":\"password123\"";
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content("{" + base + ",\"email\":\"agency-signup@example.test\",\"agency\":true}"))
            .andExpect(status().isOk());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content("{" + base + ",\"email\":\"client-signup@example.test\"}"))
            .andExpect(status().isOk());
        assertEquals(User.Role.AGENCY, users.findByEmail("agency-signup@example.test").orElseThrow().getRole());
        assertEquals(User.Role.CLIENT, users.findByEmail("client-signup@example.test").orElseThrow().getRole());
        User client = users.findByEmail("client-signup@example.test").orElseThrow();
        client.setEmailVerified(true);
        users.save(client);
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
            .content("{" + base + ",\"email\":\"client-signup@example.test\",\"agency\":true}"))
            .andExpect(status().isConflict());
        assertEquals(User.Role.CLIENT, users.findById(client.getId()).orElseThrow().getRole());
    }

    @Test
    void publicAgencyDirectoryIncludesEmptyStoresButHidesSuspendedAccounts() throws Exception {
        User active = createUser("directory-active@example.test", User.Role.AGENCY);
        User suspended = createUser("directory-suspended@example.test", User.Role.AGENCY);
        String agency = """
            {"name":"Agence Vide","logo":"/uploads/logo.jpg","phone":"+212612345678",
             "email":"directory@example.test","city":"Rabat","address":"Rue 1","description":"Agence"}
            """;
        long activeId = body(mvc.perform(put("/api/agency").header("Authorization", token(active))
            .contentType(MediaType.APPLICATION_JSON).content(agency)).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString()).get("id").asLong();
        long suspendedId = body(mvc.perform(put("/api/agency").header("Authorization", token(suspended))
            .contentType(MediaType.APPLICATION_JSON).content(agency.replace("Agence Vide", "Agence Suspendue")))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("id").asLong();
        suspended.setEnabled(false);
        users.save(suspended);
        JsonNode directory = body(mvc.perform(get("/api/public/rental-agencies"))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        boolean foundActive = false;
        for (JsonNode entry : directory) {
            if (entry.get("id").asLong() == activeId) foundActive = true;
            assertNotEquals(suspendedId, entry.get("id").asLong());
            assertFalse(entry.has("owner"));
        }
        assertTrue(foundActive);
    }

    @Test
    void agencyLifecycleFilteringAndOwnership() throws Exception {
        User owner = createUser("owner@example.test", User.Role.AGENCY);
        User other = createUser("other@example.test", User.Role.AGENCY);
        User client = createUser("rental-client@example.test", User.Role.CLIENT);
        String ownerToken = token(owner), otherToken = token(other), clientToken = token(client);
        String agency = """
            {"name":"Atlas Rent","logo":"/uploads/logo.jpg","phone":"+212612345678",
             "email":"contact@example.test","city":"Casablanca","address":"Rue 1","description":"Agence"}
            """;
        String vehicle = """
            {"title":"Logan","brand":"Dacia","model":"Logan","year":2024,"category":"Berline",
             "dailyPrice":250.50,"fuel":"Diesel","transmission":"Manuelle","status":"ACTIVE",
             "photos":["/uploads/a.jpg","/uploads/b.jpg"]}
            """;

        mvc.perform(get("/api/agency")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/agency").header("Authorization", clientToken).contentType(MediaType.APPLICATION_JSON).content(agency))
            .andExpect(status().isForbidden());
        JsonNode store = body(mvc.perform(put("/api/agency").header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content(agency))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long agencyId = store.get("id").asLong();
        mvc.perform(put("/api/agency").header("Authorization", otherToken).contentType(MediaType.APPLICATION_JSON).content(agency))
            .andExpect(status().isOk());
        mvc.perform(post("/api/agency/vehicles").header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON)
            .content(vehicle.replace("250.50", "-1"))).andExpect(status().isBadRequest());
        JsonNode created = body(mvc.perform(post("/api/agency/vehicles").header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content(vehicle))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        long vehicleId = created.get("id").asLong();
        assertEquals(2, created.get("photos").size());
        mvc.perform(put("/api/agency/vehicles/" + vehicleId).header("Authorization", otherToken).contentType(MediaType.APPLICATION_JSON).content(vehicle))
            .andExpect(status().isForbidden());
        mvc.perform(delete("/api/agency/vehicles/" + vehicleId).header("Authorization", otherToken))
            .andExpect(status().isForbidden());

        assertEquals(1, publicRentals("?city=casablanca&minPrice=250&maxPrice=251&transmission=Manuelle").size());
        assertEquals(0, publicRentals("?city=Marrakech").size());
        assertEquals(0, publicRentals("?transmission=Automatique").size());
        assertEquals(0, publicRentals("?city=Casablanca&maxPrice=250").size());
        mvc.perform(get("/api/public/rentals?minPrice=300&maxPrice=200")).andExpect(status().isBadRequest());
        assertEquals(1, body(mvc.perform(get("/api/public/rental-agencies/" + agencyId))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).get("vehicles").size());
        mvc.perform(put("/api/agency/vehicles/" + vehicleId).header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON)
            .content(vehicle.replace("ACTIVE", "RENTED"))).andExpect(status().isOk());
        assertEquals(0, publicRentals("?city=Casablanca").size());
        mvc.perform(put("/api/agency/vehicles/" + vehicleId).header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON)
            .content(vehicle.replace("ACTIVE", "PAUSED"))).andExpect(status().isOk());
        assertEquals(0, publicRentals("?city=Casablanca").size());
        assertEquals(1, body(mvc.perform(get("/api/agency/vehicles").header("Authorization", ownerToken))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString()).size());
        mvc.perform(put("/api/agency/vehicles/" + vehicleId).header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON)
            .content(vehicle)).andExpect(status().isOk());
        owner.setEnabled(false);
        users.save(owner);
        assertEquals(0, publicRentals("?city=Casablanca").size());
        mvc.perform(get("/api/public/rental-agencies/" + agencyId)).andExpect(status().isNotFound());
        owner.setEnabled(true);
        users.save(owner);
        mvc.perform(delete("/api/agency/vehicles/" + vehicleId).header("Authorization", ownerToken)).andExpect(status().isNoContent());
        assertEquals(0, publicRentals("?city=Casablanca").size());
    }

    @Test
    void migrationCascadesAgencyAndVehiclesWhenOwnerIsDeleted() throws Exception {
        try (var connection = DriverManager.getConnection("jdbc:h2:mem:rental_migration;MODE=PostgreSQL")) {
            try (var statement = connection.createStatement()) {
                statement.execute("CREATE TABLE users (id BIGINT PRIMARY KEY)");
                statement.execute("INSERT INTO users VALUES (1)");
            }
            new ResourceDatabasePopulator(new ClassPathResource("db/migration/V17__rental_agencies.sql")).populate(connection);
            try (var statement = connection.createStatement()) {
                statement.execute("INSERT INTO rental_agencies VALUES (1, 1, 'Agence', 'logo', 'phone', 'email', 'city', 'address', 'description')");
                statement.execute("INSERT INTO rental_vehicles VALUES (1, 1, 'title', 'brand', 'model', 2024, 'cat', 100, 'fuel', 'manual', 'ACTIVE', CURRENT_TIMESTAMP)");
                statement.execute("INSERT INTO rental_vehicle_photos VALUES (1, 0, 'photo')");
                statement.execute("DELETE FROM users WHERE id = 1");
                try (var result = statement.executeQuery("SELECT (SELECT COUNT(*) FROM rental_agencies) + (SELECT COUNT(*) FROM rental_vehicles) + (SELECT COUNT(*) FROM rental_vehicle_photos)")) {
                    result.next();
                    assertEquals(0, result.getInt(1));
                }
            }
        }
    }

    @Test
    void administratorsManageAgencyLimitsAndQuotaIncludesEveryStatus() throws Exception {
        User admin = createUser("rental-admin-limit@example.test", User.Role.ADMIN);
        User owner = createUser("rental-owner-limit@example.test", User.Role.AGENCY);
        User client = createUser("rental-client-limit@example.test", User.Role.CLIENT);
        String adminToken = token(admin), ownerToken = token(owner), clientToken = token(client);
        String path = "/api/admin/agencies/" + owner.getId() + "/vehicle-limit";
        String agency = """
            {"name":"Agence Limite","logo":"/uploads/logo.jpg","phone":"+212612345678",
             "email":"limit@example.test","city":"Rabat","address":"Rue 1","description":"Agence"}
            """;
        String vehicle = """
            {"title":"Voiture","brand":"Dacia","model":"Logan","year":2024,"category":"Berline",
             "dailyPrice":200,"fuel":"Diesel","transmission":"Manuelle","status":"ACTIVE","photos":["/uploads/a.jpg"]}
            """;
        mvc.perform(get("/api/admin/agencies")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/agencies").header("Authorization", ownerToken)).andExpect(status().isForbidden());
        mvc.perform(patch(path).header("Authorization", clientToken).contentType(MediaType.APPLICATION_JSON).content("{\"limit\":9}"))
            .andExpect(status().isForbidden());
        mvc.perform(patch(path).header("Authorization", adminToken).contentType(MediaType.APPLICATION_JSON).content("{\"limit\":0}"))
            .andExpect(status().isBadRequest());
        mvc.perform(patch("/api/admin/agencies/" + client.getId() + "/vehicle-limit").header("Authorization", adminToken)
            .contentType(MediaType.APPLICATION_JSON).content("{\"limit\":3}")).andExpect(status().isNotFound());
        JsonNode before = findAgency(adminToken, owner.getId());
        assertTrue(before.get("store").isNull());
        assertEquals(5, before.get("vehicleLimit").asInt());
        mvc.perform(put("/api/agency").header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content(agency))
            .andExpect(status().isOk());
        long first = -1;
        for (int i = 0; i < 5; i++) {
            String payload = i == 1 ? vehicle.replace("ACTIVE", "PAUSED") : i == 2 ? vehicle.replace("ACTIVE", "RENTED") : vehicle;
            JsonNode created = body(mvc.perform(post("/api/agency/vehicles").header("Authorization", ownerToken)
                .contentType(MediaType.APPLICATION_JSON).content(payload)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
            if (i == 0) first = created.get("id").asLong();
        }
        mvc.perform(post("/api/agency/vehicles").header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content(vehicle))
            .andExpect(status().isConflict());
        JsonNode quota = body(mvc.perform(get("/api/agency/vehicle-quota").header("Authorization", ownerToken))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertEquals(5, quota.get("count").asInt());
        assertEquals(5, quota.get("limit").asInt());
        JsonNode listing = findAgency(adminToken, owner.getId());
        assertEquals("Agence Limite", listing.get("store").get("name").asText());
        assertEquals(5, listing.get("vehicles").size());
        mvc.perform(patch(path).header("Authorization", adminToken).contentType(MediaType.APPLICATION_JSON).content("{\"limit\":2}"))
            .andExpect(status().isOk());
        mvc.perform(put("/api/agency/vehicles/" + first).header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON)
            .content(vehicle.replace("ACTIVE", "RENTED"))).andExpect(status().isOk());
        mvc.perform(delete("/api/agency/vehicles/" + first).header("Authorization", ownerToken)).andExpect(status().isNoContent());
        mvc.perform(post("/api/agency/vehicles").header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content(vehicle))
            .andExpect(status().isConflict());
        mvc.perform(patch(path).header("Authorization", adminToken).contentType(MediaType.APPLICATION_JSON).content("{\"limit\":5}"))
            .andExpect(status().isOk());
        mvc.perform(post("/api/agency/vehicles").header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content(vehicle))
            .andExpect(status().isOk());
        mvc.perform(patch("/api/admin/users/" + owner.getId() + "/enabled").header("Authorization", adminToken)
            .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false}")).andExpect(status().isOk());
        assertFalse(findAgency(adminToken, owner.getId()).get("enabled").asBoolean());
        mvc.perform(patch("/api/admin/users/" + owner.getId() + "/enabled").header("Authorization", adminToken)
            .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":true}")).andExpect(status().isOk());
        assertTrue(findAgency(adminToken, owner.getId()).get("enabled").asBoolean());
    }

    @Test
    void migrationSetsDefaultLimitForExistingAndNewUsers() throws Exception {
        try (var connection = DriverManager.getConnection("jdbc:h2:mem:agency_quota_migration;MODE=PostgreSQL")) {
            try (var statement = connection.createStatement()) {
                statement.execute("CREATE TABLE users (id BIGINT PRIMARY KEY)");
                statement.execute("INSERT INTO users (id) VALUES (1)");
            }
            new ResourceDatabasePopulator(new ClassPathResource("db/migration/V18__agency_vehicle_limit.sql")).populate(connection);
            try (var statement = connection.createStatement()) {
                statement.execute("INSERT INTO users (id) VALUES (2)");
                try (var result = statement.executeQuery("SELECT rental_vehicle_limit FROM users ORDER BY id")) {
                    assertTrue(result.next()); assertEquals(5, result.getInt(1));
                    assertTrue(result.next()); assertEquals(5, result.getInt(1));
                }
                assertThrows(java.sql.SQLException.class, () -> statement.execute("UPDATE users SET rental_vehicle_limit = 0"));
            }
        }
    }

    @Test
    void simultaneousCreationsCannotExceedLimit() throws Exception {
        User owner = createUser("rental-concurrent@example.test", User.Role.AGENCY);
        String ownerToken = token(owner);
        String agency = """
            {"name":"Agence Concurrence","logo":"/uploads/logo.jpg","phone":"+212612345678",
             "email":"concurrent@example.test","city":"Agadir","address":"Rue 1","description":"Agence"}
            """;
        String vehicle = """
            {"title":"Voiture","brand":"Dacia","model":"Logan","year":2024,"category":"Berline",
             "dailyPrice":200,"fuel":"Diesel","transmission":"Manuelle","status":"PAUSED","photos":["/uploads/a.jpg"]}
            """;
        mvc.perform(put("/api/agency").header("Authorization", ownerToken).contentType(MediaType.APPLICATION_JSON).content(agency))
            .andExpect(status().isOk());
        var executor = Executors.newFixedThreadPool(6);
        var ready = new CountDownLatch(6);
        var start = new CountDownLatch(1);
        try {
            var results = new ArrayList<java.util.concurrent.Future<Integer>>();
            for (int i = 0; i < 6; i++) {
                results.add(executor.submit(() -> {
                    ready.countDown();
                    if (!start.await(10, TimeUnit.SECONDS)) throw new IllegalStateException("Start timed out");
                    return mvc.perform(post("/api/agency/vehicles").header("Authorization", ownerToken)
                        .contentType(MediaType.APPLICATION_JSON).content(vehicle)).andReturn().getResponse().getStatus();
                }));
            }
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            int success = 0, rejected = 0;
            for (var result : results) {
                int status = result.get(30, TimeUnit.SECONDS);
                if (status == 200) success++;
                else if (status == 409) rejected++;
                else fail("Unexpected status: " + status);
            }
            assertEquals(5, success);
            assertEquals(1, rejected);
        } finally {
            start.countDown();
            executor.shutdownNow();
        }
    }

    private JsonNode findAgency(String adminToken, Long id) throws Exception {
        JsonNode agencies = body(mvc.perform(get("/api/admin/agencies").header("Authorization", adminToken))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        for (JsonNode agency : agencies) if (agency.get("userId").asLong() == id) return agency;
        throw new AssertionError("Agence introuvable : " + id);
    }

    private JsonNode publicRentals(String query) throws Exception {
        return body(mvc.perform(get("/api/public/rentals" + query)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
    }

    private JsonNode body(String value) throws Exception { return json.readTree(value); }
    private String token(User user) { return "Bearer " + jwt.generateToken(user); }
    private User createUser(String email, User.Role role) {
        LocalDateTime now = LocalDateTime.now();
        return users.save(User.builder().email(email).password("unused").firstName("Test").lastName("User")
            .role(role).enabled(true).emailVerified(true).createdAt(now).updatedAt(now).build());
    }
}
