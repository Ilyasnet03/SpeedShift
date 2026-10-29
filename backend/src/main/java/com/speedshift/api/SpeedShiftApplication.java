package com.speedshift.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class SpeedShiftApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpeedShiftApplication.class, args);
    }
}
