package com.aistudyhub.dto.workspace;

import java.time.LocalDateTime;

public record WorkspaceMessageDto(
        Long id,
        Long workspaceId,
        Long userId,
        String userName,
        String userAvatarUrl,
        String content,
        LocalDateTime createdAt
) {
}
