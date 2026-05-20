package com.aistudyhub.service;

import com.aistudyhub.dto.analytics.DashboardSummaryDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class AnalyticsService {
    private final JdbcTemplate jdbcTemplate;

    public AnalyticsService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public DashboardSummaryDto dashboardSummary() {
        return new DashboardSummaryDto(
                count("users", null),
                count("documents", "status <> 'DELETED'"),
                count("documents", "visibility = 'PUBLIC' AND status <> 'DELETED'"),
                count("chat_sessions", null),
                count("chat_messages", null),
                count("document_views", null),
                count("documents", "status = 'PENDING_REVIEW'")
        );
    }

    private long count(String table, String where) {
        String sql = where == null ? "SELECT COUNT(*) FROM " + table : "SELECT COUNT(*) FROM " + table + " WHERE " + where;
        Long value = jdbcTemplate.queryForObject(sql, Long.class);
        return value == null ? 0 : value;
    }
}
