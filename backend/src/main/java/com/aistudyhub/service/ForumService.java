package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.document.DocumentDto;
import com.aistudyhub.dto.forum.ActiveUserDto;
import com.aistudyhub.dto.forum.CreateForumAnswerRequest;
import com.aistudyhub.dto.forum.CreateForumPostRequest;
import com.aistudyhub.dto.forum.ForumAnswerDto;
import com.aistudyhub.dto.forum.ForumDetailDto;
import com.aistudyhub.dto.forum.ForumPostDto;
import com.aistudyhub.dto.forum.ForumRankingDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class ForumService {
    private static final Set<String> POST_TYPES = Set.of("QUESTION", "DISCUSSION", "DOCUMENT");

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<ForumPostDto> postMapper = (rs, rowNum) -> new ForumPostDto(
            rs.getLong("post_id"),
            rs.getLong("author_id"),
            rs.getString("author_name"),
            rs.getString("author_avatar_url"),
            nullableLong(rs, "document_id"),
            rs.getString("document_title"),
            rs.getString("original_file_name"),
            rs.getString("file_type"),
            nullableLong(rs, "file_size"),
            rs.getString("title"),
            rs.getString("content"),
            rs.getString("post_type"),
            rs.getLong("answer_count"),
            toLocalDateTime(rs.getTimestamp("created_at")),
            toLocalDateTime(rs.getTimestamp("updated_at"))
    );

    private final RowMapper<ForumAnswerDto> answerMapper = (rs, rowNum) -> new ForumAnswerDto(
            rs.getLong("answer_id"),
            rs.getLong("post_id"),
            rs.getLong("user_id"),
            rs.getString("user_name"),
            rs.getString("user_avatar_url"),
            rs.getString("content"),
            toLocalDateTime(rs.getTimestamp("created_at")),
            toLocalDateTime(rs.getTimestamp("updated_at"))
    );

    private final RowMapper<ActiveUserDto> activeUserMapper = (rs, rowNum) -> new ActiveUserDto(
            rs.getLong("user_id"),
            rs.getString("full_name"),
            rs.getString("email"),
            rs.getString("avatar_url"),
            toLocalDateTime(rs.getTimestamp("last_seen_at"))
    );

    public ForumService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ForumPostDto> listPosts(String search, String type) {
        String keyword = search == null || search.isBlank() ? "%" : "%" + search.trim() + "%";
        String normalizedType = type == null || type.isBlank() || "ALL".equalsIgnoreCase(type)
                ? "ALL"
                : normalizeType(type);

        return jdbcTemplate.query(postSelect() + """
                WHERE p.status = 'ACTIVE'
                  AND (? = 'ALL' OR p.post_type = ?)
                  AND (p.title LIKE ? OR p.content LIKE ? OR d.original_file_name LIKE ? OR u.full_name LIKE ?)
                ORDER BY p.created_at DESC
                """, postMapper, normalizedType, normalizedType, keyword, keyword, keyword, keyword);
    }

    public ForumDetailDto detail(Long postId) {
        ForumPostDto post = findPost(postId);
        List<ForumAnswerDto> answers = jdbcTemplate.query("""
                SELECT a.answer_id, a.post_id, a.user_id, u.full_name AS user_name,
                       u.avatar_url AS user_avatar_url, a.content, a.created_at, a.updated_at
                FROM forum_answers a
                INNER JOIN users u ON u.user_id = a.user_id
                WHERE a.post_id = ? AND a.status = 'ACTIVE'
                ORDER BY a.created_at ASC, a.answer_id ASC
                """, answerMapper, postId);
        return new ForumDetailDto(post, answers);
    }

    @Transactional
    public ForumPostDto createPost(Long authorId, CreateForumPostRequest request) {
        ensureActiveUser(authorId);
        String type = normalizeType(request.type() == null ? "DISCUSSION" : request.type());
        if ("DOCUMENT".equals(type)) {
            type = "DISCUSSION";
        }

        jdbcTemplate.update("""
                INSERT INTO forum_posts (author_id, title, content, post_type)
                VALUES (?, ?, ?, ?)
                """,
                authorId,
                request.title().trim(),
                emptyToNull(request.content()),
                type);

        return findLatestPostByAuthor(authorId);
    }

    @Transactional
    public ForumPostDto createDocumentPost(Long authorId, DocumentDto document, String title, String content) {
        ensureActiveUser(authorId);
        String safeTitle = title == null || title.isBlank()
                ? document.title()
                : title.trim();
        if (safeTitle == null || safeTitle.isBlank()) {
            safeTitle = document.originalFileName();
        }

        jdbcTemplate.update("""
                INSERT INTO forum_posts (author_id, document_id, title, content, post_type)
                VALUES (?, ?, ?, ?, 'DOCUMENT')
                """,
                authorId,
                document.id(),
                safeTitle,
                emptyToNull(content));

        return findLatestPostByAuthor(authorId);
    }

    @Transactional
    public ForumAnswerDto createAnswer(Long postId, Long userId, CreateForumAnswerRequest request) {
        ensureActiveUser(userId);
        findPost(postId);

        jdbcTemplate.update("""
                INSERT INTO forum_answers (post_id, user_id, content)
                VALUES (?, ?, ?)
                """, postId, userId, request.content().trim());

        return jdbcTemplate.query("""
                SELECT TOP 1 a.answer_id, a.post_id, a.user_id, u.full_name AS user_name,
                       u.avatar_url AS user_avatar_url, a.content, a.created_at, a.updated_at
                FROM forum_answers a
                INNER JOIN users u ON u.user_id = a.user_id
                WHERE a.post_id = ? AND a.user_id = ?
                ORDER BY a.created_at DESC, a.answer_id DESC
                """, answerMapper, postId, userId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Answer was not created"));
    }

    public List<ForumRankingDto> rankings(String period) {
        String normalized = "month".equalsIgnoreCase(period) ? "month" : "week";
        int days = "month".equals(normalized) ? 30 : 7;
        return jdbcTemplate.query("""
                SELECT TOP 10 u.user_id, u.full_name, u.avatar_url, COUNT(*) AS answer_count
                FROM forum_answers a
                INNER JOIN users u ON u.user_id = a.user_id
                WHERE a.status = 'ACTIVE'
                  AND a.created_at >= DATEADD(day, ?, SYSDATETIME())
                GROUP BY u.user_id, u.full_name, u.avatar_url
                ORDER BY answer_count DESC, u.full_name ASC
                """, (rs, rowNum) -> new ForumRankingDto(
                rs.getLong("user_id"),
                rs.getString("full_name"),
                rs.getString("avatar_url"),
                rs.getLong("answer_count"),
                normalized
        ), -days);
    }

    @Transactional
    public void heartbeat(Long userId) {
        ensureActiveUser(userId);
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM user_presence WHERE user_id = ?",
                Integer.class,
                userId
        );
        if (count != null && count > 0) {
            jdbcTemplate.update("""
                    UPDATE user_presence SET last_seen_at = SYSDATETIME()
                    WHERE user_id = ?
                    """, userId);
        } else {
            jdbcTemplate.update("""
                    INSERT INTO user_presence (user_id, last_seen_at)
                    VALUES (?, SYSDATETIME())
                    """, userId);
        }
    }

    public List<ActiveUserDto> activeUsers() {
        return jdbcTemplate.query("""
                SELECT TOP 20 u.user_id, u.full_name, u.email, u.avatar_url, p.last_seen_at
                FROM user_presence p
                INNER JOIN users u ON u.user_id = p.user_id
                WHERE p.last_seen_at >= DATEADD(minute, -5, SYSDATETIME())
                  AND u.status = 'ACTIVE'
                ORDER BY p.last_seen_at DESC
                """, activeUserMapper);
    }

    private ForumPostDto findPost(Long postId) {
        return jdbcTemplate.query(postSelect() + """
                WHERE p.post_id = ? AND p.status = 'ACTIVE'
                """, postMapper, postId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Forum post not found"));
    }

    private ForumPostDto findLatestPostByAuthor(Long authorId) {
        return jdbcTemplate.query(postSelect() + """
                WHERE p.author_id = ? AND p.status = 'ACTIVE'
                ORDER BY p.created_at DESC, p.post_id DESC
                """, postMapper, authorId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Forum post was not created"));
    }

    private String postSelect() {
        return """
                SELECT p.post_id, p.author_id, u.full_name AS author_name,
                       u.avatar_url AS author_avatar_url, p.document_id,
                       d.title AS document_title, d.original_file_name, d.file_type, d.file_size,
                       p.title, p.content, p.post_type, p.created_at, p.updated_at,
                       (
                           SELECT COUNT(*)
                           FROM forum_answers a
                           WHERE a.post_id = p.post_id AND a.status = 'ACTIVE'
                       ) AS answer_count
                FROM forum_posts p
                INNER JOIN users u ON u.user_id = p.author_id
                LEFT JOIN documents d ON d.document_id = p.document_id
                """;
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

    private String normalizeType(String type) {
        String normalized = type == null ? "" : type.trim().toUpperCase(Locale.ROOT);
        if (!POST_TYPES.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid forum post type");
        }
        return normalized;
    }

    private String emptyToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private Long nullableLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
