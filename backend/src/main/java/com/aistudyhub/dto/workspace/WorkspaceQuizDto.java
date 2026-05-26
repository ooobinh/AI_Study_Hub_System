package com.aistudyhub.dto.workspace;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record WorkspaceQuizDto(
        Long id,
        Long workspaceId,
        Long documentId,
        String documentTitle,
        String title,
        Long createdBy,
        String createdByName,
        String questionsJson,
        Long attemptCount,
        BigDecimal bestScore,
        LocalDateTime createdAt
) {
}
