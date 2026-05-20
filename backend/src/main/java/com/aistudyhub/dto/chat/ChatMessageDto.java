package com.aistudyhub.dto.chat;

import java.time.LocalDateTime;

public record ChatMessageDto(
        Long id,
        Long sessionId,
        String sender,
        String messageText,
        String aiModel,
        LocalDateTime createdAt
) {
}
