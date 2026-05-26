package com.aistudyhub.dto.workspace;

import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record UpdateWorkspaceTaskRequest(
        @Size(max = 180) String title,
        @Size(max = 4000) String description,
        Long assignedTo,
        @Size(max = 20) String status,
        LocalDateTime deadlineAt
) {
}
