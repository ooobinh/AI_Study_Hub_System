package com.aistudyhub.dto.subject;

import java.time.LocalDateTime;

public record SubjectDto(
        Long id,
        String code,
        String name,
        String description,
        Long documentCount,
        LocalDateTime createdAt
) {
}
