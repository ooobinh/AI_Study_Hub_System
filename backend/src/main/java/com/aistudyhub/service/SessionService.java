package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.auth.SessionStatusDto;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class SessionService {
    public static final String REQUEST_USER_ID = "authenticatedUserId";

    private final JdbcTemplate jdbcTemplate;
    private final SystemSettingsService systemSettingsService;

    public SessionService(JdbcTemplate jdbcTemplate, SystemSettingsService systemSettingsService) {
        this.jdbcTemplate = jdbcTemplate;
        this.systemSettingsService = systemSettingsService;
    }

    @Transactional
    public String createSession(Long userId, HttpServletRequest request) {
        ensureSchema();
        String sessionId = UUID.randomUUID().toString().replace("-", "");
        LocalDateTime now = LocalDateTime.now();
        int maxMinutes = systemSettingsService.getMaxSessionMinutes();

        jdbcTemplate.update("""
                INSERT INTO user_sessions (
                    session_id, user_id, issued_at, last_activity_at, expires_at, ip_address, user_agent
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                sessionId,
                userId,
                Timestamp.valueOf(now),
                Timestamp.valueOf(now),
                Timestamp.valueOf(now.plusMinutes(maxMinutes)),
                clientIp(request),
                clientUserAgent(request)
        );
        return sessionId;
    }

    @Transactional
    public SessionStatusDto validateAndTouch(String sessionId) {
        ensureSchema();
        SessionRow row = findActiveSession(sessionId);
        if (row == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Session expired or invalid. Please sign in again.");
        }

        LocalDateTime now = LocalDateTime.now();
        int idleMinutes = systemSettingsService.getIdleMinutes();

        if (row.expiresAt() != null && row.expiresAt().isBefore(now)) {
            revokeSession(sessionId, "max_session_expired");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Session expired or invalid. Please sign in again.");
        }

        if (row.lastActivityAt() != null
                && row.lastActivityAt().plusMinutes(idleMinutes).isBefore(now)) {
            revokeSession(sessionId, "idle_timeout");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Session expired due to inactivity. Please sign in again.");
        }

        jdbcTemplate.update(
                "UPDATE user_sessions SET last_activity_at = ? WHERE session_id = ? AND revoked_at IS NULL",
                Timestamp.valueOf(now),
                sessionId
        );

        long idleSecondsRemaining = Math.max(
                0,
                Duration.between(now, row.lastActivityAt().plusMinutes(idleMinutes)).getSeconds()
        );

        return new SessionStatusDto(
                row.userId(),
                now,
                row.expiresAt(),
                idleMinutes,
                systemSettingsService.getMaxSessionMinutes(),
                idleSecondsRemaining
        );
    }

    public SessionStatusDto getSessionStatus(String sessionId) {
        return validateAndTouch(sessionId);
    }

    @Transactional
    public void revokeSession(String sessionId, String reason) {
        if (sessionId == null || sessionId.isBlank()) {
            return;
        }
        ensureSchema();
        jdbcTemplate.update("""
                UPDATE user_sessions
                SET revoked_at = SYSDATETIME(),
                    revoke_reason = ?
                WHERE session_id = ? AND revoked_at IS NULL
                """, reason == null ? "revoked" : reason, sessionId);
    }

    @Transactional
    public void revokeAllSessions(Long userId, String reason) {
        if (userId == null) {
            return;
        }
        ensureSchema();
        jdbcTemplate.update("""
                UPDATE user_sessions
                SET revoked_at = SYSDATETIME(),
                    revoke_reason = ?
                WHERE user_id = ? AND revoked_at IS NULL
                """, reason == null ? "revoked" : reason, userId);
    }

    public void revokeFromAuthorizationHeader(String authorizationHeader, String reason) {
        String sessionId = extractBearerToken(authorizationHeader);
        if (sessionId != null) {
            revokeSession(sessionId, reason);
        }
    }

    public static String extractBearerToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return null;
        }
        String prefix = "Bearer ";
        if (!authorizationHeader.regionMatches(true, 0, prefix, 0, prefix.length())) {
            return null;
        }
        String token = authorizationHeader.substring(prefix.length()).trim();
        return token.isBlank() ? null : token;
    }

    public static String clientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    public static String clientUserAgent(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String userAgent = request.getHeader("User-Agent");
        if (userAgent == null) {
            return null;
        }
        return userAgent.length() > 300 ? userAgent.substring(0, 300) : userAgent;
    }

    private SessionRow findActiveSession(String sessionId) {
        return jdbcTemplate.query("""
                SELECT user_id, last_activity_at, expires_at
                FROM user_sessions
                WHERE session_id = ? AND revoked_at IS NULL
                """, rs -> rs.next()
                ? new SessionRow(
                        rs.getLong("user_id"),
                        rs.getTimestamp("last_activity_at").toLocalDateTime(),
                        rs.getTimestamp("expires_at").toLocalDateTime()
                )
                : null, sessionId);
    }

    private void ensureSchema() {
        if (!tableExists("user_sessions")) {
            jdbcTemplate.execute("""
                    CREATE TABLE [dbo].[user_sessions](
                        [session_id] [varchar](64) NOT NULL PRIMARY KEY,
                        [user_id] [bigint] NOT NULL,
                        [issued_at] [datetime2](7) NOT NULL,
                        [last_activity_at] [datetime2](7) NOT NULL,
                        [expires_at] [datetime2](7) NOT NULL,
                        [revoked_at] [datetime2](7) NULL,
                        [revoke_reason] [varchar](120) NULL,
                        [ip_address] [varchar](64) NULL,
                        [user_agent] [varchar](300) NULL,
                        CONSTRAINT [fk_user_sessions_user] FOREIGN KEY([user_id])
                            REFERENCES [dbo].[users] ([user_id]) ON DELETE CASCADE
                    )
                    """);
            jdbcTemplate.execute("""
                    CREATE NONCLUSTERED INDEX [ix_user_sessions_user]
                    ON [dbo].[user_sessions]([user_id] ASC)
                    """);
        }

        if (!tableExists("system_settings")) {
            jdbcTemplate.execute("""
                    CREATE TABLE [dbo].[system_settings](
                        [setting_key] [varchar](120) NOT NULL PRIMARY KEY,
                        [setting_value] [varchar](500) NULL,
                        [updated_at] [datetime2](7) NOT NULL
                            CONSTRAINT [DF_system_settings_updated_at] DEFAULT (SYSDATETIME())
                    )
                    """);
        }

        seedSetting("session.idle_minutes", String.valueOf(systemSettingsService.getIdleMinutes()));
        seedSetting("session.max_minutes", String.valueOf(systemSettingsService.getMaxSessionMinutes()));
    }

    private void seedSetting(String key, String value) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM system_settings WHERE setting_key = ?",
                Integer.class,
                key
        );
        if (count == null || count == 0) {
            jdbcTemplate.update(
                    "INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)",
                    key,
                    value
            );
        }
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM sys.tables t
                INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
                WHERE s.name = 'dbo' AND t.name = ?
                """, Integer.class, tableName);
        return count != null && count > 0;
    }

    private record SessionRow(Long userId, LocalDateTime lastActivityAt, LocalDateTime expiresAt) {
    }
}
