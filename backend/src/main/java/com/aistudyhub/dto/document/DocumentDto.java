package com.aistudyhub.dto.document;

import java.time.LocalDateTime;
import java.util.List;

public record DocumentDto(
        Long id,
        Long ownerId,
        String ownerName,
        Long subjectId,
        String subjectName,
        Long folderId,
        String folderName,
        Long categoryId,
        String categoryName,
        String title,
        String description,
        String originalFileName,
        String fileUrl,
        String previewUrl,
        String fileType,
        Long fileSize,
        Integer pageCount,
        String visibility,
        String status,
        Integer downloadCount,
        Integer viewCount,
        Boolean favorite,
        List<String> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
