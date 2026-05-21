package com.aistudyhub.dto.document;

public record DocumentPreviewDto(
        Long documentId,
        String previewType,
        String content,
        String message
) {
}
