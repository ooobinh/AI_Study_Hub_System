package com.aistudyhub.dto.workspace;

import jakarta.validation.constraints.Size;

public record WorkspaceAiRequest(
        @Size(max = 30) String type,
        Long documentId,
        @Size(max = 4000) String question
) {
}
