package com.aistudyhub.dto.document;

import java.time.LocalDateTime;

public record DocumentFolderDto(
        Long id,
        Long ownerId,
        String name,
        long documentCount,
        long totalSize,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
