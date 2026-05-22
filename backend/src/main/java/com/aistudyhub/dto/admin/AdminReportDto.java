package com.aistudyhub.dto.admin;

import java.time.LocalDateTime;

public record AdminReportDto(
        Long id,
        Long documentId,
        String documentTitle,
        Long reportedBy,
        String reporterName,
        String reason,
        String description,
        String status,
        LocalDateTime createdAt
) {
}
