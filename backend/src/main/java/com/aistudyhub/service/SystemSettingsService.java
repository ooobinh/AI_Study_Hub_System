package com.aistudyhub.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class SystemSettingsService {
    private final JdbcTemplate jdbcTemplate;
    private final int defaultIdleMinutes;
    private final int defaultMaxMinutes;

    public SystemSettingsService(
            JdbcTemplate jdbcTemplate,
            @Value("${app.session.idle-minutes-default:60}") int defaultIdleMinutes,
            @Value("${app.session.max-minutes-default:720}") int defaultMaxMinutes
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.defaultIdleMinutes = defaultIdleMinutes;
        this.defaultMaxMinutes = defaultMaxMinutes;
    }

    public int getIdleMinutes() {
        return getPositiveInt("session.idle_minutes", defaultIdleMinutes);
    }

    public int getMaxSessionMinutes() {
        return getPositiveInt("session.max_minutes", defaultMaxMinutes);
    }

    private int getPositiveInt(String key, int fallback) {
        if (!tableExists("system_settings")) {
            return fallback;
        }
        try {
            String value = jdbcTemplate.queryForObject(
                    "SELECT setting_value FROM system_settings WHERE setting_key = ?",
                    String.class,
                    key
            );
            if (value == null || value.isBlank()) {
                return fallback;
            }
            int parsed = Integer.parseInt(value.trim());
            return parsed > 0 ? parsed : fallback;
        } catch (Exception exception) {
            return fallback;
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
}
