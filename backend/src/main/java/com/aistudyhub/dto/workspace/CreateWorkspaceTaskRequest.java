package com.aistudyhub.dto.workspace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record CreateWorkspaceTaskRequest(
        @NotBlank @Size(max = 180) String title,
        @Size(max = 4000) String description,
        Long assignedTo,
        LocalDateTime deadlineAt
) {
}
