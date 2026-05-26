package com.aistudyhub.dto.workspace;

import jakarta.validation.constraints.Size;

public record UpdateWorkspaceRequest(
        @Size(max = 150) String name,
        @Size(max = 4000) String description,
        Long subjectId,
        @Size(max = 20) String visibility
) {
}
