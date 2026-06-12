package com.aistudyhub.dto.auth;

import java.time.LocalDateTime;

public record SessionStatusDto(
        Long userId,
        LocalDateTime lastActivityAt,
        LocalDateTime expiresAt,
        int idleMinutes,
        int maxMinutes,
        long idleSecondsRemaining
) {
}
