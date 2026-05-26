package com.aistudyhub.dto.workspace;

import java.time.LocalDateTime;

public record WorkspaceAiOutputDto(
        Long id,
        Long workspaceId,
        Long documentId,
        String documentTitle,
        Long requestedBy,
        String requestedByName,
        String outputType,
        String prompt,
        String resultText,
        LocalDateTime createdAt
) {
}
