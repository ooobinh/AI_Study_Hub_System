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
        @Size(max = 50) String fileType,
        Long fileSize,
        Integer pageCount,
        String visibility
) {
}
