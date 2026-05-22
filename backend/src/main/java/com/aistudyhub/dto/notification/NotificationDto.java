package com.aistudyhub.dto.notification;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        Long userId,
        String title,
        String content,
        boolean read,
        LocalDateTime createdAt
) {
}
