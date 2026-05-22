package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.auth.MessageResponse;
import com.aistudyhub.dto.notification.AdminNotificationRequest;
import com.aistudyhub.dto.notification.NotificationDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Service
public class NotificationService {
    private final JdbcTemplate jdbcTemplate;

    public NotificationService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<NotificationDto> listForUser(Long userId) {
        return jdbcTemplate.query("""
                SELECT TOP 30 notification_id, user_id, title, content, is_read, created_at
                FROM notifications
                WHERE user_id = ?
                ORDER BY created_at DESC
                """, this::mapNotification, userId);
    }

    @Transactional
    public NotificationDto markRead(Long notificationId, Long userId) {
        int updated = jdbcTemplate.update("""
                UPDATE notifications
                SET is_read = 1
                WHERE notification_id = ? AND user_id = ?
                """, notificationId, userId);

        if (updated == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Notification not found");
        }

        return findForUser(notificationId, userId);
    }

    @Transactional
    public MessageResponse markAllRead(Long userId) {
        jdbcTemplate.update("""
                UPDATE notifications
                SET is_read = 1
                WHERE user_id = ? AND is_read = 0
                """, userId);
        return new MessageResponse("Notifications marked as read.");
    }

    @Transactional
    public MessageResponse sendAdminNotification(AdminNotificationRequest request) {
        if (request.broadcast()) {
            int count = broadcastToActiveUsers(request.title(), request.content());
            return new MessageResponse("Notification sent to " + count + " users.");
        }

        if (request.userId() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User is required for a private notification");
        }
        if (isAdminUser(request.userId())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Choose a normal user. Admin notifications are handled internally.");
        }

        sendToUser(request.userId(), request.title(), request.content());
        return new MessageResponse("Notification sent.");
    }

    @Transactional
    public void sendToUser(Long userId, String title, String content) {
        Integer exists = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM users
                WHERE user_id = ?
                """, Integer.class, userId);

        if (exists == null || exists == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
        }

        jdbcTemplate.update("""
                INSERT INTO notifications (user_id, title, content, is_read, created_at)
                VALUES (?, ?, ?, 0, SYSDATETIME())
                """, userId, title, content);
    }

    @Transactional
    public int broadcastToActiveUsers(String title, String content) {
        return jdbcTemplate.update("""
                INSERT INTO notifications (user_id, title, content, is_read, created_at)
                SELECT user_id, ?, ?, 0, SYSDATETIME()
                FROM users
                WHERE status = 'ACTIVE'
                  AND NOT EXISTS (
                      SELECT 1
                      FROM user_roles ur
                      INNER JOIN roles r ON r.role_id = ur.role_id
                      WHERE ur.user_id = users.user_id AND r.role_name = 'ADMIN'
                  )
                """, title, content);
    }

    private boolean isAdminUser(Long userId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM user_roles ur
                INNER JOIN roles r ON r.role_id = ur.role_id
                WHERE ur.user_id = ? AND r.role_name = 'ADMIN'
                """, Integer.class, userId);
        return count != null && count > 0;
    }

    private NotificationDto findForUser(Long notificationId, Long userId) {
        return jdbcTemplate.query("""
                SELECT notification_id, user_id, title, content, is_read, created_at
                FROM notifications
                WHERE notification_id = ? AND user_id = ?
                """, this::mapNotification, notificationId, userId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Notification not found"));
    }

    private NotificationDto mapNotification(ResultSet rs, int rowNum) throws SQLException {
        return new NotificationDto(
                rs.getLong("notification_id"),
                rs.getLong("user_id"),
                rs.getString("title"),
                rs.getString("content"),
                rs.getBoolean("is_read"),
                rs.getTimestamp("created_at").toLocalDateTime()
        );
    }
}
