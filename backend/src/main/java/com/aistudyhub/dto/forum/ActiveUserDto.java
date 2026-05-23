package com.aistudyhub.dto.forum;

import java.time.LocalDateTime;

public record ActiveUserDto(
        Long userId,
        String fullName,
        String email,
        String avatarUrl,
        LocalDateTime lastSeenAt
) {
}
