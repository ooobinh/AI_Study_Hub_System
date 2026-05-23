package com.aistudyhub.dto.forum;

import java.time.LocalDateTime;

public record ForumAnswerDto(
        Long id,
        Long postId,
        Long userId,
        String userName,
        String userAvatarUrl,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
