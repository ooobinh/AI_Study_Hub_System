package com.aistudyhub.dto.document;

import jakarta.validation.constraints.Size;

public record UpdateDocumentRequest(
        Long subjectId,
        Long categoryId,
        @Size(max = 255) String title,
        String description,
        String visibility,
        String status,
        Integer pageCount
) {
}
