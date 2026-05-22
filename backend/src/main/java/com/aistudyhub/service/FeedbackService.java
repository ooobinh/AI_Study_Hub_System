package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.auth.MessageResponse;
import com.aistudyhub.dto.feedback.FeedbackRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FeedbackService {
    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    public FeedbackService(JdbcTemplate jdbcTemplate, NotificationService notificationService) {
        this.jdbcTemplate = jdbcTemplate;
        this.notificationService = notificationService;
    }

    @Transactional
    public MessageResponse create(FeedbackRequest request) {
        Integer exists = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM users
                WHERE user_id = ?
                """, Integer.class, request.userId());

        if (exists == null || exists == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
        }

        String trimmedTitle = request.title().trim();
        String reason = "[Feedback] " + trimmedTitle;
        if (reason.length() > 255) {
            reason = reason.substring(0, 255);
        }

        jdbcTemplate.update("""
                INSERT INTO reports (document_id, reported_by, reason, description, status, created_at)
                VALUES (NULL, ?, ?, ?, 'PENDING', SYSDATETIME())
                """, request.userId(), reason, request.content().trim());

        Long adminId = jdbcTemplate.query("""
                SELECT TOP 1 u.user_id
                FROM users u
                INNER JOIN user_roles ur ON ur.user_id = u.user_id
                INNER JOIN roles r ON r.role_id = ur.role_id
                WHERE r.role_name = 'ADMIN' AND u.status = 'ACTIVE'
                ORDER BY u.created_at ASC
                """, rs -> rs.next() ? rs.getLong("user_id") : null);

        if (adminId != null) {
            notificationService.sendToUser(
                    adminId,
                    "New user feedback",
                    "A user sent feedback: " + trimmedTitle
            );
        }

        return new MessageResponse("Feedback sent to admin.");
    }
}
