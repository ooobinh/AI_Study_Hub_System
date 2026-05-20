package com.aistudyhub.dto.auth;

import java.time.LocalDateTime;
import java.util.List;

public record UserDto(
        Long id,
        String fullName,
        String email,
        String avatarUrl,
        String university,
        String major,
        String status,
        List<String> roles,
        LocalDateTime createdAt
) {
}
