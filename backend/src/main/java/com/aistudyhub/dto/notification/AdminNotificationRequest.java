package com.aistudyhub.dto.notification;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AdminNotificationRequest(
        Long userId,
        boolean broadcast,
        @NotBlank @Size(max = 255) String title,
        @NotBlank String content
) {
}
