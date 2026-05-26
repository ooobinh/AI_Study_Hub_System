package com.aistudyhub.dto.workspace;

import java.time.LocalDateTime;
import java.util.List;

public record WorkspaceDocumentDto(
        Long id,
        Long ownerId,
        String ownerName,
        Long subjectId,
        String subjectName,
        Long categoryId,
        String categoryName,
        String title,
        String description,
        String originalFileName,
        String fileUrl,
        String previewUrl,
        String fileType,
        Long fileSize,
        String visibility,
        String status,
        String processingStatus,
        Long addedById,
        String addedByName,
        List<String> tags,
        LocalDateTime addedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
