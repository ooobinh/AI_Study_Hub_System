package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.document.DocumentDto;
import com.aistudyhub.dto.workspace.CreateWorkspaceMessageRequest;
import com.aistudyhub.dto.workspace.CreateWorkspaceRequest;
import com.aistudyhub.dto.workspace.JoinWorkspaceRequest;
import com.aistudyhub.dto.workspace.WorkspaceDetailDto;
import com.aistudyhub.dto.workspace.WorkspaceDto;
import com.aistudyhub.dto.workspace.WorkspaceMemberDto;
import com.aistudyhub.dto.workspace.WorkspaceMessageDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
public class WorkspaceService {
    private static final String INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcTemplate jdbcTemplate;
    private final DocumentService documentService;

    private final RowMapper<WorkspaceDto> workspaceMapper = (rs, rowNum) -> new WorkspaceDto(
            rs.getLong("workspace_id"),
            rs.getString("name"),
            rs.getString("description"),
            rs.getString("invite_code"),
            rs.getLong("owner_id"),
            rs.getString("owner_name"),
            rs.getLong("member_count"),
            rs.getLong("document_count"),
            rs.getLong("message_count"),
            toLocalDateTime(rs.getTimestamp("created_at")),
            toLocalDateTime(rs.getTimestamp("updated_at"))
    );

    private final RowMapper<WorkspaceMemberDto> memberMapper = (rs, rowNum) -> {
        long uploadedDocuments = rs.getLong("uploaded_documents");
        long messageCount = rs.getLong("message_count");
        return new WorkspaceMemberDto(
                rs.getLong("user_id"),
                rs.getString("full_name"),
                rs.getString("email"),
                rs.getString("avatar_url"),
                rs.getString("role"),
                uploadedDocuments,
                messageCount,
                uploadedDocuments * 3 + messageCount,
                toLocalDateTime(rs.getTimestamp("joined_at"))
        );
    };

    private final RowMapper<WorkspaceMessageDto> messageMapper = (rs, rowNum) -> new WorkspaceMessageDto(
            rs.getLong("message_id"),
            rs.getLong("workspace_id"),
            rs.getLong("user_id"),
            rs.getString("full_name"),
            rs.getString("avatar_url"),
            rs.getString("content"),
            toLocalDateTime(rs.getTimestamp("created_at"))
    );

    public WorkspaceService(JdbcTemplate jdbcTemplate, DocumentService documentService) {
        this.jdbcTemplate = jdbcTemplate;
        this.documentService = documentService;
    }

    public List<WorkspaceDto> list(Long userId) {
        ensureActiveUser(userId);
        return jdbcTemplate.query(workspaceSelect() + """
                WHERE w.status = 'ACTIVE'
                  AND EXISTS (
                      SELECT 1 FROM workspace_members wm
                      WHERE wm.workspace_id = w.workspace_id AND wm.user_id = ?
                  )
                ORDER BY w.updated_at DESC
                """, workspaceMapper, userId);
    }

    @Transactional
    public WorkspaceDto create(CreateWorkspaceRequest request, Long ownerId) {
        ensureActiveUser(ownerId);
        String name = request.name().trim();
        String description = request.description() == null || request.description().isBlank()
                ? null
                : request.description().trim();
        String inviteCode = generateInviteCode();

        jdbcTemplate.update("""
                INSERT INTO workspaces (name, description, invite_code, owner_id)
                VALUES (?, ?, ?, ?)
                """, name, description, inviteCode, ownerId);

        Long workspaceId = jdbcTemplate.query("""
                SELECT workspace_id
                FROM workspaces
                WHERE invite_code = ?
                """, rs -> rs.next() ? rs.getLong("workspace_id") : null, inviteCode);

        if (workspaceId == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Workspace was not created");
        }

        jdbcTemplate.update("""
                INSERT INTO workspace_members (workspace_id, user_id, role)
                VALUES (?, ?, 'OWNER')
                """, workspaceId, ownerId);

        return findWorkspace(workspaceId, ownerId);
    }

    @Transactional
    public WorkspaceDto join(JoinWorkspaceRequest request, Long userId) {
        ensureActiveUser(userId);
        String code = normalizeInviteCode(request.inviteCode());
        Long workspaceId = jdbcTemplate.query("""
                SELECT workspace_id
                FROM workspaces
                WHERE invite_code = ? AND status = 'ACTIVE'
                """, rs -> rs.next() ? rs.getLong("workspace_id") : null, code);

        if (workspaceId == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Workspace code not found");
        }

        Integer membershipCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM workspace_members
                WHERE workspace_id = ? AND user_id = ?
                """, Integer.class, workspaceId, userId);

        if (membershipCount == null || membershipCount == 0) {
            jdbcTemplate.update("""
                    INSERT INTO workspace_members (workspace_id, user_id, role)
                    VALUES (?, ?, 'MEMBER')
                    """, workspaceId, userId);
            jdbcTemplate.update("""
                    UPDATE workspaces SET updated_at = SYSDATETIME()
                    WHERE workspace_id = ?
                    """, workspaceId);
        }

        return findWorkspace(workspaceId, userId);
    }

    public WorkspaceDetailDto detail(Long workspaceId, Long userId) {
        ensureMember(workspaceId, userId);
        WorkspaceDto workspace = findWorkspace(workspaceId, userId);
        List<WorkspaceMemberDto> members = listMembers(workspaceId);
        List<DocumentDto> documents = documentService.listForWorkspace(workspaceId, userId);
        List<WorkspaceMessageDto> messages = listMessages(workspaceId);
        return new WorkspaceDetailDto(workspace, members, documents, messages);
    }

    @Transactional
    public void addDocument(Long workspaceId, Long documentId, Long userId) {
        ensureMember(workspaceId, userId);
        documentService.findById(documentId, userId);

        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM workspace_documents
                WHERE workspace_id = ? AND document_id = ?
                """, Integer.class, workspaceId, documentId);

        if (count != null && count > 0) {
            return;
        }

        jdbcTemplate.update("""
                INSERT INTO workspace_documents (workspace_id, document_id, added_by)
                VALUES (?, ?, ?)
                """, workspaceId, documentId, userId);
        jdbcTemplate.update("""
                UPDATE workspaces SET updated_at = SYSDATETIME()
                WHERE workspace_id = ?
                """, workspaceId);
    }

    @Transactional
    public WorkspaceMessageDto createMessage(Long workspaceId, Long userId, CreateWorkspaceMessageRequest request) {
        ensureMember(workspaceId, userId);
        String content = request.content().trim();
        jdbcTemplate.update("""
                INSERT INTO workspace_messages (workspace_id, user_id, content)
                VALUES (?, ?, ?)
                """, workspaceId, userId, content);
        jdbcTemplate.update("""
                UPDATE workspaces SET updated_at = SYSDATETIME()
                WHERE workspace_id = ?
                """, workspaceId);

        return jdbcTemplate.query("""
                SELECT TOP 1 wm.message_id, wm.workspace_id, wm.user_id, u.full_name, u.avatar_url,
                       wm.content, wm.created_at
                FROM workspace_messages wm
                INNER JOIN users u ON u.user_id = wm.user_id
                WHERE wm.workspace_id = ? AND wm.user_id = ?
                ORDER BY wm.created_at DESC, wm.message_id DESC
                """, messageMapper, workspaceId, userId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Message was not created"));
    }

    public void ensureMember(Long workspaceId, Long userId) {
        if (workspaceId == null || userId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "workspaceId and userId are required");
        }

        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM workspace_members wm
                INNER JOIN workspaces w ON w.workspace_id = wm.workspace_id
                WHERE wm.workspace_id = ? AND wm.user_id = ? AND w.status = 'ACTIVE'
                """, Integer.class, workspaceId, userId);

        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a member of this workspace");
        }
    }

    private WorkspaceDto findWorkspace(Long workspaceId, Long userId) {
        ensureMember(workspaceId, userId);
        return jdbcTemplate.query(workspaceSelect() + """
                WHERE w.workspace_id = ? AND w.status = 'ACTIVE'
                """, workspaceMapper, workspaceId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Workspace not found"));
    }

    private List<WorkspaceMemberDto> listMembers(Long workspaceId) {
        return jdbcTemplate.query("""
                SELECT wm.user_id, u.full_name, u.email, u.avatar_url, wm.role, wm.joined_at,
                       (
                           SELECT COUNT(*)
                           FROM workspace_documents wd
                           WHERE wd.workspace_id = wm.workspace_id AND wd.added_by = wm.user_id
                       ) AS uploaded_documents,
                       (
                           SELECT COUNT(*)
                           FROM workspace_messages msg
                           WHERE msg.workspace_id = wm.workspace_id AND msg.user_id = wm.user_id
                       ) AS message_count
                FROM workspace_members wm
                INNER JOIN users u ON u.user_id = wm.user_id
                WHERE wm.workspace_id = ?
                ORDER BY ((
                           SELECT COUNT(*)
                           FROM workspace_documents wd
                           WHERE wd.workspace_id = wm.workspace_id AND wd.added_by = wm.user_id
                       ) * 3 + (
                           SELECT COUNT(*)
                           FROM workspace_messages msg
                           WHERE msg.workspace_id = wm.workspace_id AND msg.user_id = wm.user_id
                       )) DESC,
                       wm.joined_at ASC
                """, memberMapper, workspaceId);
    }

    private List<WorkspaceMessageDto> listMessages(Long workspaceId) {
        return jdbcTemplate.query("""
                SELECT wm.message_id, wm.workspace_id, wm.user_id, u.full_name, u.avatar_url,
                       wm.content, wm.created_at
                FROM workspace_messages wm
                INNER JOIN users u ON u.user_id = wm.user_id
                WHERE wm.workspace_id = ?
                ORDER BY wm.created_at ASC, wm.message_id ASC
                """, messageMapper, workspaceId);
    }

    private String workspaceSelect() {
        return """
                SELECT w.workspace_id, w.name, w.description, w.invite_code, w.owner_id,
                       owner.full_name AS owner_name, w.created_at, w.updated_at,
                       (
                           SELECT COUNT(*)
                           FROM workspace_members wm
                           WHERE wm.workspace_id = w.workspace_id
                       ) AS member_count,
                       (
                           SELECT COUNT(*)
                           FROM workspace_documents wd
                           WHERE wd.workspace_id = w.workspace_id
                       ) AS document_count,
                       (
                           SELECT COUNT(*)
                           FROM workspace_messages msg
                           WHERE msg.workspace_id = w.workspace_id
                       ) AS message_count
                FROM workspaces w
                INNER JOIN users owner ON owner.user_id = w.owner_id
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

    private String generateInviteCode() {
        String candidate;
        do {
            StringBuilder builder = new StringBuilder("WS");
            for (int i = 0; i < 6; i++) {
                builder.append(INVITE_ALPHABET.charAt(RANDOM.nextInt(INVITE_ALPHABET.length())));
            }
            candidate = builder.toString();
        } while (inviteCodeExists(candidate));
        return candidate;
    }

    private boolean inviteCodeExists(String code) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM workspaces WHERE invite_code = ?",
                Integer.class,
                code
        );
        return count != null && count > 0;
    }

    private String normalizeInviteCode(String code) {
        String normalized = code == null ? "" : code.trim()
                .toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]", "");
        if (normalized.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Workspace code is required");
        }
        return normalized;
    }

    private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }
}
