package com.aistudyhub.dto.workspace;

import java.time.LocalDateTime;

public record WorkspaceFlashcardSetDto(
        Long id,
        Long workspaceId,
        Long documentId,
        String documentTitle,
        String title,
        Long createdBy,
        String createdByName,
        String cardsJson,
        Integer reviewedCount,
        Integer totalCount,
        LocalDateTime createdAt
) {
}
