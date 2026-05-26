package com.aistudyhub.dto.workspace;

import java.time.LocalDateTime;

public record WorkspaceActivityDto(
        Long id,
        Long workspaceId,
        Long userId,
        String userName,
        String userAvatarUrl,
        String activityType,
        String entityType,
        Long entityId,
        String description,
        LocalDateTime createdAt
) {
}
