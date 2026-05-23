package com.aistudyhub.dto.forum;

public record ForumRankingDto(
        Long userId,
        String fullName,
        String avatarUrl,
        Long answerCount,
        String period
) {
}
