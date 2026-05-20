package com.aistudyhub.dto.chat;

import java.time.LocalDateTime;

public record ChatSessionDto(
        Long id,
        Long userId,
        Long documentId,
        String sessionTitle,
        String lastMessage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
