package com.aistudyhub.dto.workspace;

import jakarta.validation.constraints.Min;

public record WorkspaceFlashcardProgressRequest(
        @Min(0) Integer reviewedCount,
        @Min(0) Integer totalCount
) {
}
