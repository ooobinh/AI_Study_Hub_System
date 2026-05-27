package com.aistudyhub.dto.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateDocumentRequest(
        @NotNull Long ownerId,
        Long subjectId,
        Long categoryId,
        @NotBlank @Size(max = 255) String title,
        String description,
        @NotBlank @Size(max = 255) String originalFileName,
        @NotBlank String fileUrl,
        String previewUrl,
        @Size(max = 255) String fileType,
        Long fileSize,
        Integer pageCount,
        String visibility,
        Long folderId
) {
    public CreateDocumentRequest(
            Long ownerId,
            Long subjectId,
            Long categoryId,
            String title,
            String description,
            String originalFileName,
            String fileUrl,
            String previewUrl,
            String fileType,
            Long fileSize,
            Integer pageCount,
            String visibility
    ) {
        this(ownerId, subjectId, categoryId, title, description, originalFileName, fileUrl, previewUrl, fileType, fileSize, pageCount, visibility, null);
    }
}
