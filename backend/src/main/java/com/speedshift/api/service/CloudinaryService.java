package com.speedshift.api.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;

@Service
public class CloudinaryService {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryService.class);

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;
    private final String folder;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public CloudinaryService(
        @Value("${app.cloudinary.cloud-name:}") String cloudName,
        @Value("${app.cloudinary.api-key:}") String apiKey,
        @Value("${app.cloudinary.api-secret:}") String apiSecret,
        @Value("${app.cloudinary.folder:speedshift}") String folder
    ) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
        this.folder = folder;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(30_000);
        this.restTemplate = new RestTemplate(factory);
    }

    public boolean isConfigured() {
        return !cloudName.isBlank() && !apiKey.isBlank() && !apiSecret.isBlank();
    }

    /** Uploads the image and returns Cloudinary's secure_url (https). */
    public String upload(byte[] image) {
        long timestamp = System.currentTimeMillis() / 1000;
        String signature = sha1("folder=" + folder + "&timestamp=" + timestamp + apiSecret);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("file", new ByteArrayResource(image) {
            @Override
            public String getFilename() {
                return "vehicle.jpg";
            }
        });
        body.add("api_key", apiKey);
        body.add("timestamp", String.valueOf(timestamp));
        body.add("folder", folder);
        body.add("signature", signature);

        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        try {
            String response = restTemplate.postForObject(
                "https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload",
                new org.springframework.http.HttpEntity<>(body, headers),
                String.class
            );
            JsonNode secureUrl = objectMapper.readTree(response).get("secure_url");
            if (secureUrl == null || secureUrl.asText().isBlank()) {
                logger.warn("Cloudinary returned a response without a secure image URL");
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Réponse Cloudinary invalide.");
            }
            return secureUrl.asText();
        } catch (RestClientException | java.io.IOException exception) {
            logger.warn("Cloudinary image upload failed", exception);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Échec de l'envoi de l'image vers Cloudinary.");
        }
    }

    /** Derives a 640px thumbnail URL from a Cloudinary delivery URL. */
    public static String thumbnailUrl(String secureUrl) {
        return secureUrl.replace("/image/upload/", "/image/upload/c_limit,w_640,q_auto,f_auto/");
    }

    private static String sha1(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-1").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
