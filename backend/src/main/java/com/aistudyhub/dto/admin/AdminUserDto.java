package com.aistudyhub.dto.admin;

import java.time.LocalDateTime;
import java.util.List;

public record AdminUserDto(
        Long id,
        String fullName,
        String email,
        String avatarUrl,
        String university,
        String major,
        String status,
        List<String> roles,
        long documentCount,
        LocalDateTime createdAt
) {
}
