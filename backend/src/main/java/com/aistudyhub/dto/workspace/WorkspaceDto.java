package com.aistudyhub.dto.workspace;

import java.time.LocalDateTime;

public record WorkspaceDto(
        Long id,
        String name,
        String description,
        String inviteCode,
        Long ownerId,
        String ownerName,
        Long memberCount,
        Long documentCount,
        Long messageCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
