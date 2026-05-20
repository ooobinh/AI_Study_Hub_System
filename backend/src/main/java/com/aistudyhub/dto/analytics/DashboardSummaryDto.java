package com.aistudyhub.dto.analytics;

public record DashboardSummaryDto(
        long totalUsers,
        long totalDocuments,
        long totalPublicDocuments,
        long totalChatSessions,
        long totalChatMessages,
        long totalDocumentViews,
        long pendingReviewDocuments
) {
}
