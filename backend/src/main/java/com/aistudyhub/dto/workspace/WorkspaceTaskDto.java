package com.aistudyhub.dto.workspace;

import java.time.LocalDateTime;

public record WorkspaceTaskDto(
        Long id,
        Long workspaceId,
        String title,
        String description,
        Long assignedTo,
        String assignedToName,
        Long createdBy,
        String createdByName,
        String status,
        LocalDateTime deadlineAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
