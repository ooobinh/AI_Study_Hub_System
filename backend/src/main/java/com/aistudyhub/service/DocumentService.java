package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.document.CreateDocumentRequest;
import com.aistudyhub.dto.document.DocumentDto;
import com.aistudyhub.dto.document.DocumentShareDto;
import com.aistudyhub.dto.document.UpdateDocumentRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class DocumentService {
    private static final Set<String> DOCUMENT_STATUSES = Set.of("ACTIVE", "PENDING_REVIEW", "REJECTED", "DELETED");

    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<DocumentDto> documentMapper = new RowMapper<>() {
        @Override
        public DocumentDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            Long id = rs.getLong("document_id");
            return new DocumentDto(
                    id,
                    rs.getLong("owner_id"),
                    rs.getString("owner_name"),
                    nullableLong(rs, "subject_id"),
                    rs.getString("subject_name"),
                    nullableLong(rs, "category_id"),
                    rs.getString("category_name"),
                    rs.getString("title"),
                    rs.getString("description"),
                    rs.getString("original_file_name"),
                    rs.getString("file_url"),
                    rs.getString("preview_url"),
                    rs.getString("file_type"),
                    nullableLong(rs, "file_size"),
                    nullableInt(rs, "page_count"),
                    rs.getString("visibility"),
                    rs.getString("status"),
                    rs.getInt("download_count"),
                    rs.getInt("view_count"),
                    rs.getBoolean("favorite"),
                    findTags(id),
                    rs.getTimestamp("created_at").toLocalDateTime(),
                    rs.getTimestamp("updated_at").toLocalDateTime()
            );
        }
    };

    public DocumentService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<DocumentDto> list(String search, Long subjectId, Long userId) {
        String keyword = search == null || search.isBlank() ? "%" : "%" + search.trim() + "%";
        Long effectiveSubjectId = subjectId == null ? -1L : subjectId;
        Long effectiveUserId = userId == null ? -1L : userId;

        if (effectiveUserId != -1L && isAdminUser(effectiveUserId)) {
            return jdbcTemplate.query(baseSelect() + """
                    WHERE d.status <> 'DELETED'
                      AND (? = -1 OR d.subject_id = ?)
                      AND (d.title LIKE ? OR d.description LIKE ? OR d.original_file_name LIKE ?)
                    ORDER BY d.created_at DESC
                    """,
                    documentMapper,
                    effectiveUserId,
                    effectiveSubjectId,
                    effectiveSubjectId,
                    keyword,
                    keyword,
                    keyword);
        }

        return jdbcTemplate.query(baseSelect() + """
                WHERE d.status <> 'DELETED'
                  AND (
                      (? = -1 AND d.visibility = 'PUBLIC')
                      OR (? <> -1 AND (d.owner_id = ? OR d.visibility = 'PUBLIC'))
                  )
                  AND (? = -1 OR d.subject_id = ?)
                  AND (d.title LIKE ? OR d.description LIKE ? OR d.original_file_name LIKE ?)
                ORDER BY d.created_at DESC
                """,
                documentMapper,
                effectiveUserId,
                effectiveUserId,
                effectiveUserId,
                effectiveUserId,
                effectiveSubjectId,
                effectiveSubjectId,
                keyword,
                keyword,
                keyword);
    }

    public List<DocumentDto> listForAdmin(Long adminId) {
        if (adminId == null || !isAdminUser(adminId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only admins can view all documents");
        }

        return jdbcTemplate.query(baseSelect() + """
                WHERE d.status <> 'DELETED'
                ORDER BY d.created_at DESC
                """, documentMapper, adminId);
    }

    public DocumentDto findById(Long id, Long userId) {
        DocumentDto document = findByIdInternal(id, userId);

        if ("PRIVATE".equals(document.visibility())
                && (userId == null || (!document.ownerId().equals(userId)
                && !isAdminUser(userId)
                && !isWorkspaceMemberForDocument(userId, id)))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You do not have access to this document");
        }

        return document;
    }

    public List<DocumentDto> listForWorkspace(Long workspaceId, Long userId) {
        if (workspaceId == null || userId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "workspaceId and userId are required");
        }

        if (!isWorkspaceMember(workspaceId, userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a member of this workspace");
        }

        return jdbcTemplate.query(baseSelect() + """
                INNER JOIN workspace_documents wd
                    ON wd.document_id = d.document_id AND wd.workspace_id = ?
                WHERE d.status <> 'DELETED'
                ORDER BY wd.created_at DESC
                """, documentMapper, userId, workspaceId);
    }

    @Transactional
    public DocumentDto create(CreateDocumentRequest request) {
        String visibility = request.visibility() == null ? "PRIVATE" : request.visibility().toUpperCase();
        jdbcTemplate.update("""
                INSERT INTO documents (
                    owner_id, subject_id, category_id, title, description, original_file_name,
                    file_url, preview_url, file_type, file_size, page_count, visibility,
                    status, download_count, view_count, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, 0, SYSDATETIME(), SYSDATETIME())
                """,
                request.ownerId(),
                request.subjectId(),
                request.categoryId(),
                request.title(),
                request.description(),
                request.originalFileName(),
                request.fileUrl(),
                request.previewUrl(),
                request.fileType(),
                request.fileSize(),
                request.pageCount(),
                visibility);

        Long id = jdbcTemplate.query("""
                SELECT TOP 1 document_id
                FROM documents
                WHERE owner_id = ? AND original_file_name = ?
                ORDER BY created_at DESC
                """, rs -> rs.next() ? rs.getLong("document_id") : null, request.ownerId(), request.originalFileName());

        return findById(id, request.ownerId());
    }

    @Transactional
    public DocumentDto update(Long id, UpdateDocumentRequest request, Long userId) {
        DocumentDto current = findByIdInternal(id, null);
        ensureCanManageDocument(current, userId);
        jdbcTemplate.update("""
                UPDATE documents
                SET subject_id = ?, category_id = ?, title = ?, description = ?,
                    visibility = ?, status = ?, page_count = ?, updated_at = SYSDATETIME()
                WHERE document_id = ?
                """,
                request.subjectId() == null ? current.subjectId() : request.subjectId(),
                request.categoryId() == null ? current.categoryId() : request.categoryId(),
                request.title() == null ? current.title() : request.title(),
                request.description() == null ? current.description() : request.description(),
                request.visibility() == null ? current.visibility() : request.visibility().toUpperCase(),
                request.status() == null ? current.status() : request.status().toUpperCase(),
                request.pageCount() == null ? current.pageCount() : request.pageCount(),
                id);
        return findByIdInternal(id, null);
    }

    @Transactional
    public void softDelete(Long id, Long userId) {
        DocumentDto current = findByIdInternal(id, userId);
        ensureCanManageDocument(current, userId);
        int updated = jdbcTemplate.update("""
                UPDATE documents SET status = 'DELETED', updated_at = SYSDATETIME()
                WHERE document_id = ?
                """, id);
        if (updated == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Document not found");
        }
    }

    @Transactional
    public void toggleFavorite(Long userId, Long documentId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*) FROM document_favorites WHERE user_id = ? AND document_id = ?
                """, Integer.class, userId, documentId);
        if (count != null && count > 0) {
            jdbcTemplate.update("DELETE FROM document_favorites WHERE user_id = ? AND document_id = ?", userId, documentId);
        } else {
            jdbcTemplate.update("INSERT INTO document_favorites (user_id, document_id) VALUES (?, ?)", userId, documentId);
        }
    }

    @Transactional
    public void recordView(Long documentId, Long userId) {
        findById(documentId, userId);
        jdbcTemplate.update("UPDATE documents SET view_count = view_count + 1 WHERE document_id = ?", documentId);
        jdbcTemplate.update("""
                INSERT INTO document_views (document_id, user_id)
                VALUES (?, ?)
                """, documentId, userId);
    }

    @Transactional
    public void recordDownload(Long documentId) {
        findByIdInternal(documentId, null);
        jdbcTemplate.update("UPDATE documents SET download_count = download_count + 1 WHERE document_id = ?", documentId);
    }

    @Transactional
    public DocumentShareDto createShare(Long documentId, Long sharedBy, String permission) {
        findById(documentId, sharedBy);
        String sharePermission = permission == null || permission.isBlank() ? "VIEW" : permission.toUpperCase();
        String token = UUID.randomUUID().toString();

        jdbcTemplate.update("""
                INSERT INTO document_shares (document_id, shared_by, share_token, permission)
                VALUES (?, ?, ?, ?)
                """, documentId, sharedBy, token, sharePermission);

        return jdbcTemplate.query("""
                SELECT TOP 1 share_id, document_id, share_token, permission, created_at
                FROM document_shares
                WHERE share_token = ?
                """, (rs, rowNum) -> new DocumentShareDto(
                rs.getLong("share_id"),
                rs.getLong("document_id"),
                rs.getString("share_token"),
                rs.getString("permission"),
                "",
                rs.getTimestamp("created_at").toLocalDateTime()
        ), token).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Share link was not created"));
    }

    public DocumentDto findByShareToken(String token) {
        Long documentId = jdbcTemplate.query("""
                SELECT document_id
                FROM document_shares
                WHERE share_token = ?
                  AND (expired_at IS NULL OR expired_at > SYSDATETIME())
                """, rs -> rs.next() ? rs.getLong("document_id") : null, token);

        if (documentId == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Share link not found or expired");
        }

        return findByIdInternal(documentId, null);
    }

    public List<DocumentDto> pendingReview() {
        return jdbcTemplate.query(baseSelect() + """
                WHERE d.status = 'PENDING_REVIEW'
                ORDER BY d.created_at DESC
                """, documentMapper, -1L);
    }

    @Transactional
    public DocumentDto updateStatus(Long id, String status) {
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase();
        if (!DOCUMENT_STATUSES.contains(normalizedStatus)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid document status");
        }

        int updated = jdbcTemplate.update("""
                UPDATE documents
                SET status = ?, updated_at = SYSDATETIME()
                WHERE document_id = ?
                """, normalizedStatus, id);

        if (updated == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Document not found");
        }

        return findByIdInternal(id, null);
    }

    private DocumentDto findByIdInternal(Long id, Long userId) {
        Long effectiveUserId = userId == null ? -1L : userId;
        return jdbcTemplate.query(baseSelect() + """
                WHERE d.document_id = ?
                """, documentMapper, effectiveUserId, id).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Document not found"));
    }

    private String baseSelect() {
        return """
                SELECT d.document_id, d.owner_id, u.full_name AS owner_name,
                       d.subject_id, s.subject_name, d.category_id, c.category_name,
                       d.title, d.description, d.original_file_name, d.file_url, d.preview_url,
                       d.file_type, d.file_size, d.page_count, d.visibility, d.status,
                       d.download_count, d.view_count, d.created_at, d.updated_at,
                       CASE WHEN EXISTS (
                           SELECT 1 FROM document_favorites f
                           WHERE f.document_id = d.document_id AND f.user_id = ?
                       ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS favorite
                FROM documents d
                INNER JOIN users u ON u.user_id = d.owner_id
                LEFT JOIN subjects s ON s.subject_id = d.subject_id
                LEFT JOIN categories c ON c.category_id = d.category_id
                """;
    }

    private List<String> findTags(Long documentId) {
        return jdbcTemplate.queryForList("""
                SELECT t.tag_name
                FROM document_tags t
                INNER JOIN document_tag_mapping m ON m.tag_id = t.tag_id
                WHERE m.document_id = ?
                ORDER BY t.tag_name
                """, String.class, documentId);
    }

    private void ensureCanManageDocument(DocumentDto document, Long userId) {
        if (userId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "userId is required");
        }
        if (!document.ownerId().equals(userId) && !isAdminUser(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You can only manage your own documents");
        }
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

    private boolean isWorkspaceMemberForDocument(Long userId, Long documentId) {
        if (userId == null || documentId == null) {
            return false;
        }

        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM workspace_documents wd
                INNER JOIN workspace_members wm ON wm.workspace_id = wd.workspace_id
                INNER JOIN workspaces w ON w.workspace_id = wd.workspace_id
                WHERE wd.document_id = ?
                  AND wm.user_id = ?
                  AND w.status = 'ACTIVE'
                """, Integer.class, documentId, userId);
        return count != null && count > 0;
    }

    private boolean isWorkspaceMember(Long workspaceId, Long userId) {
        if (workspaceId == null || userId == null) {
            return false;
        }

        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM workspace_members wm
                INNER JOIN workspaces w ON w.workspace_id = wm.workspace_id
                WHERE wm.workspace_id = ?
                  AND wm.user_id = ?
                  AND w.status = 'ACTIVE'
                """, Integer.class, workspaceId, userId);
        return count != null && count > 0;
    }

    private Long nullableLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private Integer nullableInt(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }
}
