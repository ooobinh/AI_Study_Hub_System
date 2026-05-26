package com.aistudyhub.dto.workspace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWorkspaceCommentRequest(
        @NotBlank @Size(max = 4000) String content
) {
}
