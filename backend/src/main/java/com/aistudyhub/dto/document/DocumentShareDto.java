package com.aistudyhub.dto.document;

import java.time.LocalDateTime;

public record DocumentShareDto(
        Long shareId,
        Long documentId,
        String shareToken,
        String permission,
        String shareUrl,
        LocalDateTime createdAt
) {
}
