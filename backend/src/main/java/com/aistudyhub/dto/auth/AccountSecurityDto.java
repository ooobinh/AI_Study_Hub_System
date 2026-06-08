package com.aistudyhub.dto.auth;

import java.time.LocalDateTime;

public record AccountSecurityDto(
        Long userId,
        String email,
        boolean emailVerified,
        LocalDateTime emailVerifiedAt,
        boolean googleLinked,
        LocalDateTime createdAt,
        LocalDateTime emailVerificationDeadline
) {
}
