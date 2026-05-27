package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.admin.AdminReportDto;
import com.aistudyhub.dto.admin.AdminUserDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class AdminService {
    private static final Set<String> USER_STATUSES = Set.of("ACTIVE", "INACTIVE", "BANNED");
    private static final Set<String> REPORT_STATUSES = Set.of("PENDING", "RESOLVED", "REJECTED");

    private final JdbcTemplate jdbcTemplate;
    private final NotificationService notificationService;

    public AdminService(JdbcTemplate jdbcTemplate, NotificationService notificationService) {
        this.jdbcTemplate = jdbcTemplate;
        this.notificationService = notificationService;
    }

    public List<AdminUserDto> listUsers() {
        return jdbcTemplate.query("""
                SELECT u.user_id, u.full_name, u.email, u.avatar_url, u.university, u.major,
                       u.status, u.created_at,
                       (
                           SELECT COUNT(*)
                           FROM documents d
                           WHERE d.owner_id = u.user_id AND d.status <> 'DELETED'
                       ) AS document_count
                FROM users u
                WHERE u.status <> 'DELETED'
                ORDER BY u.created_at DESC
                """, this::mapUser);
    }

    @Transactional
    public AdminUserDto updateUserStatus(Long id, String status) {
        String normalizedStatus = normalizeStatus(status, USER_STATUSES, "Invalid user status");
        if (isAdminUser(id) && !"ACTIVE".equals(normalizedStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admin accounts cannot be suspended or banned");
        }

        int updated = jdbcTemplate.update("""
                UPDATE users
                SET status = ?, updated_at = SYSDATETIME()
                WHERE user_id = ? AND status <> 'DELETED'
                """, normalizedStatus, id);

        if (updated == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
        }

        if ("BANNED".equals(normalizedStatus)) {
            notificationService.sendToUser(
                    id,
                    "Account blocked by admin",
                    "Your account has been blocked by an administrator. Contact support if you believe this is a mistake."
            );
        } else if ("INACTIVE".equals(normalizedStatus)) {
            notificationService.sendToUser(
                    id,
                    "Account suspended by admin",
                    "Your account has been suspended by an administrator."
            );
        } else if ("ACTIVE".equals(normalizedStatus)) {
            notificationService.sendToUser(
                    id,
                    "Account reactivated",
                    "Your account has been reactivated by an administrator."
            );
        }

        return findUser(id);
    }

    @Transactional
    public void deleteUser(Long id, Long adminId) {
        if (adminId == null || !isAdminUser(adminId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only admins can delete accounts");
        }
        if (id.equals(adminId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot delete your own admin account");
        }
        if (isAdminUser(id)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Admin accounts cannot be deleted");
        }

        String anonymizedEmail = "deleted-user-%d-%s@deleted.local".formatted(id, UUID.randomUUID());
        int updated = jdbcTemplate.update("""
                UPDATE users
                SET full_name = ?,
                    email = ?,
                    password_hash = ?,
                    avatar_url = NULL,
                    phone = NULL,
                    university = NULL,
                    major = NULL,
                    status = 'DELETED',
                    updated_at = SYSDATETIME()
                WHERE user_id = ?
                  AND status <> 'DELETED'
                """,
                "Deleted User #" + id,
                anonymizedEmail,
                UUID.randomUUID().toString() + UUID.randomUUID(),
                id);

        if (updated == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
        }

        jdbcTemplate.update("DELETE FROM notifications WHERE user_id = ?", id);
        jdbcTemplate.update("DELETE FROM password_reset_tokens WHERE user_id = ?", id);
        jdbcTemplate.update("DELETE FROM user_settings WHERE user_id = ?", id);
    }

    public List<AdminReportDto> listReports() {
        return jdbcTemplate.query("""
                SELECT r.report_id, r.document_id, d.title AS document_title,
                       r.reported_by, u.full_name AS reporter_name, r.reason,
                       r.description, r.status, r.created_at
                FROM reports r
                INNER JOIN users u ON u.user_id = r.reported_by
                LEFT JOIN documents d ON d.document_id = r.document_id
                ORDER BY r.created_at DESC
                """, this::mapReport);
    }

    @Transactional
    public AdminReportDto updateReportStatus(Long id, String status) {
        String normalizedStatus = normalizeStatus(status, REPORT_STATUSES, "Invalid report status");
        int updated = jdbcTemplate.update("""
                UPDATE reports
                SET status = ?
                WHERE report_id = ?
                """, normalizedStatus, id);

        if (updated == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Report not found");
        }

        return findReport(id);
    }

    private AdminUserDto findUser(Long id) {
        return jdbcTemplate.query("""
                SELECT u.user_id, u.full_name, u.email, u.avatar_url, u.university, u.major,
                       u.status, u.created_at,
                       (
                           SELECT COUNT(*)
                           FROM documents d
                           WHERE d.owner_id = u.user_id AND d.status <> 'DELETED'
                       ) AS document_count
                FROM users u
                WHERE u.user_id = ? AND u.status <> 'DELETED'
                """, this::mapUser, id).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private AdminReportDto findReport(Long id) {
        return jdbcTemplate.query("""
                SELECT r.report_id, r.document_id, d.title AS document_title,
                       r.reported_by, u.full_name AS reporter_name, r.reason,
                       r.description, r.status, r.created_at
                FROM reports r
                INNER JOIN users u ON u.user_id = r.reported_by
                LEFT JOIN documents d ON d.document_id = r.document_id
                WHERE r.report_id = ?
                """, this::mapReport, id).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Report not found"));
    }

    private AdminUserDto mapUser(ResultSet rs, int rowNum) throws SQLException {
        Long userId = rs.getLong("user_id");
        return new AdminUserDto(
                userId,
                rs.getString("full_name"),
                rs.getString("email"),
                rs.getString("avatar_url"),
                rs.getString("university"),
                rs.getString("major"),
                rs.getString("status"),
                findRoles(userId),
                rs.getLong("document_count"),
                toLocalDateTime(rs.getTimestamp("created_at"))
        );
    }

    private AdminReportDto mapReport(ResultSet rs, int rowNum) throws SQLException {
        long documentId = rs.getLong("document_id");
        boolean documentIdWasNull = rs.wasNull();
        return new AdminReportDto(
                rs.getLong("report_id"),
                documentIdWasNull ? null : documentId,
                rs.getString("document_title"),
                rs.getLong("reported_by"),
                rs.getString("reporter_name"),
                rs.getString("reason"),
                rs.getString("description"),
                rs.getString("status"),
                toLocalDateTime(rs.getTimestamp("created_at"))
        );
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private List<String> findRoles(Long userId) {
        return jdbcTemplate.queryForList("""
                SELECT r.role_name
                FROM roles r
                INNER JOIN user_roles ur ON ur.role_id = r.role_id
                WHERE ur.user_id = ?
                ORDER BY r.role_name
                """, String.class, userId);
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

    private String normalizeStatus(String status, Set<String> allowedStatuses, String message) {
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase();
        if (!allowedStatuses.contains(normalizedStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
        return normalizedStatus;
    }
}
