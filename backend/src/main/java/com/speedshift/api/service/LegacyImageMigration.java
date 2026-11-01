package com.speedshift.api.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

/**
 * Older listings stored photos as base64 data URIs directly in listings.image_url, which made
 * /api/listings several MB large. This moves them to uploaded_images (or Cloudinary) once at startup.
 */
@Component
public class LegacyImageMigration implements ApplicationRunner {

    private static final Logger logger = LoggerFactory.getLogger(LegacyImageMigration.class);

    private final JdbcTemplate jdbc;
    private final CloudinaryService cloudinary;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public LegacyImageMigration(JdbcTemplate jdbc, CloudinaryService cloudinary) {
        this.jdbc = jdbc;
        this.cloudinary = cloudinary;
    }

    @Override
    public void run(ApplicationArguments args) {
        Thread worker = new Thread(this::migrate, "legacy-image-migration");
        worker.setDaemon(true);
        worker.start();
    }

    private void migrate() {
        try {
            List<Long> ids = jdbc.queryForList("SELECT id FROM listings WHERE image_url LIKE '%data:image%'", Long.class);
            for (Long id : ids) {
                try {
                    migrateListing(id);
                } catch (Exception exception) {
                    logger.warn("Could not migrate images of listing {}: {}", id, exception.getMessage());
                }
            }
            if (!ids.isEmpty()) logger.info("Legacy image migration finished for {} listing(s)", ids.size());
        } catch (Exception exception) {
            logger.warn("Legacy image migration skipped: {}", exception.getMessage());
        }
    }

    private void migrateListing(Long id) throws Exception {
        String raw = jdbc.queryForObject("SELECT image_url FROM listings WHERE id = ?", String.class, id);
        if (raw == null) return;

        List<String> sources = raw.trim().startsWith("[")
            ? objectMapper.readValue(raw, new TypeReference<List<String>>() { })
            : List.of(raw);

        List<String> migrated = new ArrayList<>();
        for (String source : sources) {
            migrated.add(source.startsWith("data:image") ? store(source) : source);
        }
        String value = migrated.size() == 1 ? migrated.get(0) : objectMapper.writeValueAsString(migrated);
        jdbc.update("UPDATE listings SET image_url = ? WHERE id = ?", value, id);
    }

    private String store(String dataUri) throws Exception {
        String base64 = dataUri.substring(dataUri.indexOf(',') + 1);
        BufferedImage image = ImageIO.read(new ByteArrayInputStream(Base64.getDecoder().decode(base64)));
        if (image == null) throw new IllegalArgumentException("unreadable image");

        byte[] full = ImageUtils.encode(ImageUtils.scale(image, 1600));
        if (cloudinary.isConfigured()) return cloudinary.upload(full);

        String name = UUID.randomUUID() + ".jpg";
        jdbc.update("INSERT INTO uploaded_images (name, data, thumbnail) VALUES (?, ?, ?)",
            name, full, ImageUtils.encode(ImageUtils.scale(image, 640)));
        return "/uploads/" + name;
    }
}
