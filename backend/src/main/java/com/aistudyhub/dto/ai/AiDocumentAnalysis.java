package com.aistudyhub.dto.ai;

import java.util.List;

public record AiDocumentAnalysis(
        String title,
        String description,
        String subject,
        String category,
        List<String> tags,
        String summary
) {
}
