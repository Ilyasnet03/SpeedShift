package com.speedshift.api.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
public class ChatController {

    @MessageMapping("/chat.send")
    @SendTo("/topic/messages")
    public Map<String, Object> sendMessage(Map<String, Object> payload) {
        payload.put("timestamp", LocalDateTime.now().toString());
        return payload;
    }
}
