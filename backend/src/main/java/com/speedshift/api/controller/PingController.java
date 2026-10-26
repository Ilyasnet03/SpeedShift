package com.speedshift.api.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PingController {

    // Lightweight, DB-free endpoint for external uptime monitors (e.g. UptimeRobot).
    @GetMapping({"/ping", "/api/ping"})
    public ResponseEntity<String> ping() {
        return ResponseEntity.ok("Server is alive");
    }
}
