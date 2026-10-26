package com.speedshift.api.controller;

import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
public class UploadController {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final int MAX_SIZE = 1600;
    private static final int THUMB_SIZE = 640;

    private final JdbcTemplate jdbc;

    public UploadController(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @PostMapping("/api/uploads")
    public ResponseEntity<Map<String, String>> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty() || file.getContentType() == null || !ALLOWED_TYPES.contains(file.getContentType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Format d'image non supporté.");
        }
        BufferedImage source;
        try (var input = file.getInputStream()) {
            source = ImageIO.read(input);
        }
        if (source == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image illisible.");
        }

        String name = UUID.randomUUID() + ".jpg";
        jdbc.update("INSERT INTO uploaded_images (name, data, thumbnail) VALUES (?, ?, ?)",
            name, encode(scale(source, MAX_SIZE)), encode(scale(source, THUMB_SIZE)));

        return ResponseEntity.ok(Map.of("url", "/uploads/" + name, "thumbnailUrl", "/uploads/thumbs/" + name));
    }
    @GetMapping("/uploads/{name:[A-Za-z0-9-]+\\.jpg}")
    public ResponseEntity<byte[]> image(@PathVariable String name) {
        return serve("data", name);
    }

    @GetMapping("/uploads/thumbs/{name:[A-Za-z0-9-]+\\.jpg}")
    public ResponseEntity<byte[]> thumbnail(@PathVariable String name) {
        return serve("thumbnail", name);
    }

    private ResponseEntity<byte[]> serve(String column, String name) {
        List<byte[]> rows = jdbc.query("SELECT " + column + " FROM uploaded_images WHERE name = ?", (rs, i) -> rs.getBytes(1), name);
        if (rows.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok()
            .contentType(MediaType.IMAGE_JPEG)
            .cacheControl(CacheControl.maxAge(Duration.ofDays(365)).cachePublic().immutable())
            .body(rows.get(0));
    }

    private byte[] encode(BufferedImage image) throws IOException {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(image, "jpg", output);
        return output.toByteArray();
    }

    // Always returns an RGB image so JPEG encoding works for PNG/WebP sources with alpha.
    private BufferedImage scale(BufferedImage source, int maxSide) {
        double ratio = Math.min(1.0, (double) maxSide / Math.max(source.getWidth(), source.getHeight()));
        int width = Math.max(1, (int) Math.round(source.getWidth() * ratio));
        int height = Math.max(1, (int) Math.round(source.getHeight() * ratio));
        BufferedImage target = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = target.createGraphics();
        graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        graphics.setColor(Color.WHITE);
        graphics.fillRect(0, 0, width, height);
        graphics.drawImage(source, 0, 0, width, height, null);
        graphics.dispose();
        return target;
    }
}
