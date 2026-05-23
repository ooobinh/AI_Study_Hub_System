package com.aistudyhub.dto.workspace;

import java.time.LocalDateTime;

public record WorkspaceMemberDto(
        Long userId,
        String fullName,
        String email,
        String avatarUrl,
        String role,
        Long uploadedDocuments,
        Long messageCount,
        Long contributionScore,
        LocalDateTime joinedAt
) {
}
