package com.aistudyhub.dto.workspace;

import java.time.LocalDateTime;
import java.util.List;

public record WorkspacePostDto(
        Long id,
        Long workspaceId,
        Long authorId,
        String authorName,
        String authorAvatarUrl,
        String title,
        String content,
        Boolean pinned,
        Long attachedDocumentId,
        String attachedDocumentTitle,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<WorkspaceCommentDto> comments
) {
}
