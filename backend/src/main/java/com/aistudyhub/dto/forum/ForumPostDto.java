package com.aistudyhub.dto.forum;

import java.time.LocalDateTime;

public record ForumPostDto(
        Long id,
        Long authorId,
        String authorName,
        String authorAvatarUrl,
        Long documentId,
        String documentTitle,
        String originalFileName,
        String fileType,
        Long fileSize,
        String title,
        String content,
        String type,
        Long answerCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
