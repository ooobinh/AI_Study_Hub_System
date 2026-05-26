package com.aistudyhub.dto.workspace;

import java.time.LocalDateTime;

public record WorkspaceCommentDto(
        Long id,
        Long postId,
        Long userId,
        String userName,
        String userAvatarUrl,
        String content,
        LocalDateTime createdAt
) {
}
