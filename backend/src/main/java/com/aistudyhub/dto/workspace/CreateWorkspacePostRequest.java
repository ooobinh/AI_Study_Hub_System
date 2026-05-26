package com.aistudyhub.dto.workspace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWorkspacePostRequest(
        @NotBlank @Size(max = 180) String title,
        @NotBlank @Size(max = 8000) String content,
        Boolean pinned,
        Long attachedDocumentId
) {
}
