package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.subject.CreateSubjectRequest;
import com.aistudyhub.dto.subject.SubjectDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Locale;

@Service
public class SubjectService {
    private final JdbcTemplate jdbcTemplate;

    public SubjectService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<SubjectDto> list(Long userId, String search) {
        Long effectiveUserId = userId == null ? -1L : userId;
        int admin = isAdminUser(userId) ? 1 : 0;
        String keyword = search == null || search.isBlank() ? "%" : "%" + search.trim() + "%";

        return jdbcTemplate.query("""
                SELECT s.subject_id, s.subject_code, s.subject_name, s.description, s.created_at,
                       (
                           SELECT COUNT(*)
                           FROM documents d
                           WHERE d.subject_id = s.subject_id
                             AND d.status <> 'DELETED'
                             AND (
                                 ? = 1
                                 OR (? = -1 AND d.visibility = 'PUBLIC')
                                 OR (? <> -1 AND (d.owner_id = ? OR d.visibility = 'PUBLIC'))
                             )
                       ) AS document_count
                FROM subjects s
                WHERE s.subject_name LIKE ? OR s.subject_code LIKE ?
                ORDER BY document_count DESC, s.subject_name ASC
                """,
                this::mapSubject,
                admin,
                effectiveUserId,
                effectiveUserId,
                effectiveUserId,
                keyword,
                keyword);
    }

    @Transactional
    public SubjectDto create(CreateSubjectRequest request, Long userId) {
        ensureActiveUser(userId);

        String name = request.subjectName().trim();
        String code = request.subjectCode() == null || request.subjectCode().isBlank()
                ? generateCode(name)
                : normalizeCode(request.subjectCode());
        String description = request.description() == null || request.description().isBlank()
                ? null
                : request.description().trim();

        if (codeExists(code)) {
            throw new ApiException(HttpStatus.CONFLICT, "Subject code already exists");
        }

        Integer existingNameCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM subjects
                WHERE LOWER(subject_name) = LOWER(?)
                """, Integer.class, name);
        if (existingNameCount != null && existingNameCount > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Subject name already exists");
        }

        jdbcTemplate.update("""
                INSERT INTO subjects (subject_code, subject_name, description)
                VALUES (?, ?, ?)
                """, code, name, description);

        Long id = jdbcTemplate.query("""
                SELECT subject_id
                FROM subjects
                WHERE subject_code = ?
                """, rs -> rs.next() ? rs.getLong("subject_id") : null, code);

        return findById(id, userId);
    }

    public SubjectDto findById(Long id, Long userId) {
        Long effectiveUserId = userId == null ? -1L : userId;
        int admin = isAdminUser(userId) ? 1 : 0;

        return jdbcTemplate.query("""
                SELECT s.subject_id, s.subject_code, s.subject_name, s.description, s.created_at,
                       (
                           SELECT COUNT(*)
                           FROM documents d
                           WHERE d.subject_id = s.subject_id
                             AND d.status <> 'DELETED'
                             AND (
                                 ? = 1
                                 OR (? = -1 AND d.visibility = 'PUBLIC')
                                 OR (? <> -1 AND (d.owner_id = ? OR d.visibility = 'PUBLIC'))
                             )
                       ) AS document_count
                FROM subjects s
                WHERE s.subject_id = ?
                """,
                this::mapSubject,
                admin,
                effectiveUserId,
                effectiveUserId,
                effectiveUserId,
                id).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Subject not found"));
    }

    private SubjectDto mapSubject(ResultSet rs, int rowNum) throws SQLException {
        var createdAt = rs.getTimestamp("created_at");
        return new SubjectDto(
                rs.getLong("subject_id"),
                rs.getString("subject_code"),
                rs.getString("subject_name"),
                rs.getString("description"),
                rs.getLong("document_count"),
                createdAt == null ? null : createdAt.toLocalDateTime()
        );
    }

    private void ensureActiveUser(Long userId) {
        if (userId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "userId is required");
        }

        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM users
                WHERE user_id = ? AND status = 'ACTIVE'
                """, Integer.class, userId);
        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Active user is required");
        }
    }

    private String generateCode(String name) {
        String base = normalizeCode(name);
        if (base.length() > 16) {
            base = base.substring(0, 16);
        }

        String candidate = base;
        int attempt = 2;
        while (codeExists(candidate)) {
            String suffix = "-" + attempt;
            int maxBaseLength = Math.min(base.length(), 50 - suffix.length());
            candidate = base.substring(0, maxBaseLength) + suffix;
            attempt += 1;
        }
        return candidate;
    }

    private String normalizeCode(String value) {
        String normalized = value.trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "-")
                .replaceAll("(^-+|-+$)", "");
        return normalized.isBlank() ? "SUBJECT" : normalized.substring(0, Math.min(50, normalized.length()));
    }

    private boolean codeExists(String code) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM subjects WHERE subject_code = ?",
                Integer.class,
                code
        );
        return count != null && count > 0;
    }

    private boolean isAdminUser(Long userId) {
        if (userId == null || userId == -1L) {
            return false;
        }

        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM user_roles ur
                INNER JOIN roles r ON r.role_id = ur.role_id
                WHERE ur.user_id = ? AND r.role_name = 'ADMIN'
                """, Integer.class, userId);
        return count != null && count > 0;
    }
}
