package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.workspace.CreateWorkspaceCommentRequest;
import com.aistudyhub.dto.workspace.CreateWorkspaceMessageRequest;
import com.aistudyhub.dto.workspace.CreateWorkspacePostRequest;
import com.aistudyhub.dto.workspace.CreateWorkspaceRequest;
import com.aistudyhub.dto.workspace.CreateWorkspaceTaskRequest;
import com.aistudyhub.dto.workspace.InviteWorkspaceMemberRequest;
import com.aistudyhub.dto.workspace.JoinWorkspaceRequest;
import com.aistudyhub.dto.workspace.UpdateWorkspaceMemberRoleRequest;
import com.aistudyhub.dto.workspace.UpdateWorkspaceRequest;
import com.aistudyhub.dto.workspace.UpdateWorkspaceTaskRequest;
import com.aistudyhub.dto.workspace.WorkspaceActivityDto;
import com.aistudyhub.dto.workspace.WorkspaceAiOutputDto;
import com.aistudyhub.dto.workspace.WorkspaceAiRequest;
import com.aistudyhub.dto.workspace.WorkspaceCommentDto;
import com.aistudyhub.dto.workspace.WorkspaceDetailDto;
import com.aistudyhub.dto.workspace.WorkspaceDocumentDto;
import com.aistudyhub.dto.workspace.WorkspaceDto;
import com.aistudyhub.dto.workspace.WorkspaceFlashcardProgressRequest;
import com.aistudyhub.dto.workspace.WorkspaceFlashcardSetDto;
import com.aistudyhub.dto.workspace.WorkspaceInvitationDto;
import com.aistudyhub.dto.workspace.WorkspaceMemberDto;
import com.aistudyhub.dto.workspace.WorkspaceMessageDto;
import com.aistudyhub.dto.workspace.WorkspacePostDto;
import com.aistudyhub.dto.workspace.WorkspaceQuizAttemptRequest;
import com.aistudyhub.dto.workspace.WorkspaceQuizDto;
import com.aistudyhub.dto.workspace.WorkspaceTaskDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class WorkspaceService {
    private static final String INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final Set<String> INVITE_ROLES = Set.of("ADMIN", "MEMBER", "VIEWER");
    private static final Set<String> TASK_STATUSES = Set.of("TODO", "IN_PROGRESS", "DONE");
    private static final Set<String> AI_TYPES = Set.of("CHAT", "SUMMARY", "QUIZ", "FLASHCARD", "REVIEW_QUESTIONS");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final JdbcTemplate jdbcTemplate;
    private final DocumentService documentService;
    private final DocumentAiService documentAiService;
    private final GeminiService geminiService;
    private final ResendEmailService resendEmailService;
    private final String frontendUrl;

    private final RowMapper<WorkspaceDto> workspaceMapper = (rs, rowNum) -> new WorkspaceDto(
            rs.getLong("workspace_id"),
            rs.getString("name"),
            rs.getString("description"),
            rs.getString("invite_code"),
            rs.getLong("owner_id"),
            rs.getString("owner_name"),
            nullableLong(rs, "subject_id"),
            rs.getString("subject_name"),
            rs.getString("visibility"),
            rs.getLong("member_count"),
            rs.getLong("document_count"),
            rs.getLong("message_count"),
            toLocalDateTime(rs.getTimestamp("created_at")),
            toLocalDateTime(rs.getTimestamp("updated_at"))
    );

    private final RowMapper<WorkspaceMemberDto> memberMapper = (rs, rowNum) -> {
        long uploadedDocuments = rs.getLong("uploaded_documents");
        long messageCount = rs.getLong("message_count");
        long taskCount = rs.getLong("task_count");
        long postCount = rs.getLong("post_count");
        long commentCount = rs.getLong("comment_count");
        return new WorkspaceMemberDto(
                rs.getLong("user_id"),
                rs.getString("full_name"),
                rs.getString("email"),
                rs.getString("avatar_url"),
                rs.getString("role"),
                uploadedDocuments,
                messageCount + postCount + commentCount + taskCount,
                uploadedDocuments * 4 + postCount * 3 + commentCount * 2 + taskCount + messageCount,
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

    private final RowMapper<WorkspaceDocumentDto> documentMapper = (rs, rowNum) -> {
        Long documentId = rs.getLong("document_id");
        return new WorkspaceDocumentDto(
                documentId,
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
                rs.getString("visibility"),
                rs.getString("status"),
                rs.getString("processing_status"),
                rs.getLong("added_by"),
                rs.getString("added_by_name"),
                findTags(documentId),
                toLocalDateTime(rs.getTimestamp("added_at")),
                toLocalDateTime(rs.getTimestamp("created_at")),
                toLocalDateTime(rs.getTimestamp("updated_at"))
        );
    };

    private final RowMapper<WorkspaceTaskDto> taskMapper = (rs, rowNum) -> new WorkspaceTaskDto(
            rs.getLong("task_id"),
            rs.getLong("workspace_id"),
            rs.getString("title"),
            rs.getString("description"),
            nullableLong(rs, "assigned_to"),
            rs.getString("assigned_to_name"),
            rs.getLong("created_by"),
            rs.getString("created_by_name"),
            rs.getString("status"),
            toLocalDateTime(rs.getTimestamp("deadline_at")),
            toLocalDateTime(rs.getTimestamp("created_at")),
            toLocalDateTime(rs.getTimestamp("updated_at"))
    );

    private final RowMapper<WorkspaceCommentDto> commentMapper = (rs, rowNum) -> new WorkspaceCommentDto(
            rs.getLong("comment_id"),
            rs.getLong("post_id"),
            rs.getLong("user_id"),
            rs.getString("full_name"),
            rs.getString("avatar_url"),
            rs.getString("content"),
            toLocalDateTime(rs.getTimestamp("created_at"))
    );

    private final RowMapper<WorkspaceActivityDto> activityMapper = (rs, rowNum) -> new WorkspaceActivityDto(
            rs.getLong("activity_id"),
            rs.getLong("workspace_id"),
            nullableLong(rs, "user_id"),
            rs.getString("full_name"),
            rs.getString("avatar_url"),
            rs.getString("activity_type"),
            rs.getString("entity_type"),
            nullableLong(rs, "entity_id"),
            rs.getString("description"),
            toLocalDateTime(rs.getTimestamp("created_at"))
    );

    private final RowMapper<WorkspaceAiOutputDto> aiOutputMapper = (rs, rowNum) -> new WorkspaceAiOutputDto(
            rs.getLong("output_id"),
            rs.getLong("workspace_id"),
            nullableLong(rs, "document_id"),
            rs.getString("document_title"),
            rs.getLong("requested_by"),
            rs.getString("requested_by_name"),
            rs.getString("output_type"),
            rs.getString("prompt"),
            rs.getString("result_text"),
            toLocalDateTime(rs.getTimestamp("created_at"))
    );

    private final RowMapper<WorkspaceQuizDto> quizMapper = (rs, rowNum) -> new WorkspaceQuizDto(
            rs.getLong("quiz_id"),
            rs.getLong("workspace_id"),
            nullableLong(rs, "document_id"),
            rs.getString("document_title"),
            rs.getString("title"),
            rs.getLong("created_by"),
            rs.getString("created_by_name"),
            rs.getString("questions_json"),
            rs.getLong("attempt_count"),
            rs.getBigDecimal("best_score"),
            toLocalDateTime(rs.getTimestamp("created_at"))
    );

    private final RowMapper<WorkspaceFlashcardSetDto> flashcardSetMapper = (rs, rowNum) -> {
        String cards = rs.getString("cards_json");
        Integer totalCount = nullableInt(rs, "total_count");
        return new WorkspaceFlashcardSetDto(
                rs.getLong("set_id"),
                rs.getLong("workspace_id"),
                nullableLong(rs, "document_id"),
                rs.getString("document_title"),
                rs.getString("title"),
                rs.getLong("created_by"),
                rs.getString("created_by_name"),
                cards,
                nullableInt(rs, "reviewed_count") == null ? 0 : nullableInt(rs, "reviewed_count"),
                totalCount == null || totalCount == 0 ? estimateCardCount(cards) : totalCount,
                toLocalDateTime(rs.getTimestamp("created_at"))
        );
    };

    public WorkspaceService(
            JdbcTemplate jdbcTemplate,
            DocumentService documentService,
            DocumentAiService documentAiService,
            GeminiService geminiService,
            ResendEmailService resendEmailService,
            @Value("${app.frontend.url}") String frontendUrl
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.documentService = documentService;
        this.documentAiService = documentAiService;
        this.geminiService = geminiService;
        this.resendEmailService = resendEmailService;
        this.frontendUrl = frontendUrl == null || frontendUrl.isBlank()
                ? "http://localhost:3000"
                : frontendUrl.replaceAll("/+$", "");
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
        String name = requiredTrim(request.name(), "Workspace name is required");
        String description = blankToNull(request.description());
        Long subjectId = ensureSubjectExists(request.subjectId());
        String visibility = normalizeVisibility(request.visibility());
        String inviteCode = generateInviteCode();

        jdbcTemplate.update("""
                INSERT INTO workspaces (name, description, invite_code, owner_id, subject_id, visibility)
                VALUES (?, ?, ?, ?, ?, ?)
                """, name, description, inviteCode, ownerId, subjectId, visibility);

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
        logActivity(workspaceId, ownerId, "WORKSPACE_CREATED", "WORKSPACE", workspaceId, "created this workspace");

        return findWorkspace(workspaceId, ownerId);
    }

    @Transactional
    public WorkspaceDto update(Long workspaceId, Long userId, UpdateWorkspaceRequest request) {
        ensureOwnerOrAdmin(workspaceId, userId);
        WorkspaceDto current = findWorkspace(workspaceId, userId);
        String name = request.name() == null || request.name().isBlank()
                ? current.name()
                : request.name().trim();
        String description = blankToNull(request.description());
        Long subjectId = ensureSubjectExists(request.subjectId());
        String visibility = request.visibility() == null ? current.visibility() : normalizeVisibility(request.visibility());

        jdbcTemplate.update("""
                UPDATE workspaces
                SET name = ?, description = ?, subject_id = ?, visibility = ?, updated_at = SYSDATETIME()
                WHERE workspace_id = ?
                """, name, description, subjectId, visibility, workspaceId);
        logActivity(workspaceId, userId, "WORKSPACE_UPDATED", "WORKSPACE", workspaceId, "updated workspace settings");
        return findWorkspace(workspaceId, userId);
    }

    @Transactional
    public void deleteWorkspace(Long workspaceId, Long userId) {
        ensureOwner(workspaceId, userId);
        jdbcTemplate.update("""
                UPDATE workspaces
                SET status = 'ARCHIVED', updated_at = SYSDATETIME()
                WHERE workspace_id = ?
                """, workspaceId);
        logActivity(workspaceId, userId, "WORKSPACE_DELETED", "WORKSPACE", workspaceId, "deleted this workspace");
    }

    @Transactional
    public WorkspaceDto join(JoinWorkspaceRequest request, Long userId) {
        ensureActiveUser(userId);
        String rawCode = requiredTrim(request.inviteCode(), "Workspace code is required");
        WorkspaceDto acceptedInvitation = tryAcceptInvitation(rawCode, userId);
        if (acceptedInvitation != null) {
            return acceptedInvitation;
        }

        String code = normalizeInviteCode(rawCode);
        Long workspaceId = jdbcTemplate.query("""
                SELECT workspace_id
                FROM workspaces
                WHERE invite_code = ? AND status = 'ACTIVE'
                """, rs -> rs.next() ? rs.getLong("workspace_id") : null, code);

        if (workspaceId == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Workspace code not found");
        }

        addMemberIfMissing(workspaceId, userId, "MEMBER");
        touchWorkspace(workspaceId);
        logActivity(workspaceId, userId, "MEMBER_JOINED", "MEMBER", userId, "joined the workspace");
        return findWorkspace(workspaceId, userId);
    }

    @Transactional
    public WorkspaceDto acceptInvitation(String token, Long userId) {
        ensureActiveUser(userId);
        WorkspaceDto workspace = tryAcceptInvitation(requiredTrim(token, "Invitation token is required"), userId);
        if (workspace == null) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Invitation not found or expired");
        }
        return workspace;
    }

    public WorkspaceDetailDto detail(Long workspaceId, Long userId) {
        ensureMember(workspaceId, userId);
        WorkspaceDto workspace = findWorkspace(workspaceId, userId);
        return new WorkspaceDetailDto(
                workspace,
                listMembers(workspaceId),
                listDocuments(workspaceId),
                listMessages(workspaceId),
                listTasks(workspaceId),
                listPosts(workspaceId),
                listActivities(workspaceId),
                listAiOutputs(workspaceId),
                listInvitations(workspaceId),
                listQuizzes(workspaceId, userId),
                listFlashcardSets(workspaceId, userId)
        );
    }

    @Transactional
    public void addDocument(Long workspaceId, Long documentId, Long userId) {
        ensureCanContribute(workspaceId, userId);
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
        touchWorkspace(workspaceId);
        logActivity(workspaceId, userId, "DOCUMENT_UPLOADED", "DOCUMENT", documentId, "uploaded a document");
    }

    @Transactional
    public WorkspaceMessageDto createMessage(Long workspaceId, Long userId, CreateWorkspaceMessageRequest request) {
        ensureCanContribute(workspaceId, userId);
        String content = requiredTrim(request.content(), "Message content is required");
        jdbcTemplate.update("""
                INSERT INTO workspace_messages (workspace_id, user_id, content)
                VALUES (?, ?, ?)
                """, workspaceId, userId, content);
        touchWorkspace(workspaceId);
        logActivity(workspaceId, userId, "MESSAGE_CREATED", "MESSAGE", null, "sent a quick message");

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

    @Transactional
    public WorkspaceInvitationDto createInvitation(Long workspaceId, Long userId, InviteWorkspaceMemberRequest request) {
        ensureOwnerOrAdmin(workspaceId, userId);
        String role = normalizeInviteRole(request.role());
        String email = blankToNull(request.email());
        String token = UUID.randomUUID().toString().replace("-", "");

        jdbcTemplate.update("""
                INSERT INTO workspace_invitations (workspace_id, invited_email, invite_token, role, invited_by, expires_at)
                VALUES (?, ?, ?, ?, ?, DATEADD(day, 7, SYSDATETIME()))
                """, workspaceId, email, token, role, userId);

        WorkspaceDto workspace = findWorkspace(workspaceId, userId);
        String inviterName = userDisplayName(userId);
        if (email != null && resendEmailService.isConfigured()) {
            resendEmailService.sendWorkspaceInviteEmail(email, workspace.name(), inviterName, inviteUrl(token));
        }
        logActivity(workspaceId, userId, "INVITATION_CREATED", "INVITATION", null,
                email == null ? "created an invite link" : "invited " + email);
        return listInvitations(workspaceId).stream()
                .filter(invitation -> invitation.inviteToken().equals(token))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Invitation was not created"));
    }

    @Transactional
    public WorkspaceMemberDto updateMemberRole(
            Long workspaceId,
            Long userId,
            Long memberId,
            UpdateWorkspaceMemberRoleRequest request
    ) {
        ensureOwnerOrAdmin(workspaceId, userId);
        if (userId.equals(memberId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "You cannot change your own workspace role");
        }
        String targetRole = roleFor(workspaceId, memberId);
        if ("OWNER".equals(targetRole)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Workspace owner role cannot be changed");
        }
        String role = normalizeInviteRole(request.role());
        jdbcTemplate.update("""
                UPDATE workspace_members
                SET role = ?
                WHERE workspace_id = ? AND user_id = ?
                """, role, workspaceId, memberId);
        logActivity(workspaceId, userId, "MEMBER_ROLE_CHANGED", "MEMBER", memberId, "changed a member role to " + role);
        return listMembers(workspaceId).stream()
                .filter(member -> member.userId().equals(memberId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Member not found"));
    }

    @Transactional
    public void removeMember(Long workspaceId, Long userId, Long memberId) {
        ensureOwnerOrAdmin(workspaceId, userId);
        if (userId.equals(memberId)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Use leave workspace instead");
        }
        String targetRole = roleFor(workspaceId, memberId);
        if ("OWNER".equals(targetRole)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Workspace owner cannot be removed");
        }
        jdbcTemplate.update("""
                DELETE FROM workspace_members
                WHERE workspace_id = ? AND user_id = ?
                """, workspaceId, memberId);
        logActivity(workspaceId, userId, "MEMBER_REMOVED", "MEMBER", memberId, "removed a member");
    }

    @Transactional
    public void leave(Long workspaceId, Long userId) {
        String role = roleFor(workspaceId, userId);
        if ("OWNER".equals(role)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Workspace owner must delete the workspace or transfer ownership first");
        }
        logActivity(workspaceId, userId, "MEMBER_LEFT", "MEMBER", userId, "left the workspace");
        jdbcTemplate.update("""
                DELETE FROM workspace_members
                WHERE workspace_id = ? AND user_id = ?
                """, workspaceId, userId);
    }

    @Transactional
    public WorkspaceTaskDto createTask(Long workspaceId, Long userId, CreateWorkspaceTaskRequest request) {
        ensureCanContribute(workspaceId, userId);
        Long assignedTo = request.assignedTo();
        if (assignedTo != null) {
            ensureMember(workspaceId, assignedTo);
        }
        jdbcTemplate.update("""
                INSERT INTO workspace_tasks (workspace_id, title, description, assigned_to, created_by, deadline_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                workspaceId,
                requiredTrim(request.title(), "Task title is required"),
                blankToNull(request.description()),
                assignedTo,
                userId,
                request.deadlineAt());
        touchWorkspace(workspaceId);
        Long taskId = lastIdForUser("""
                SELECT TOP 1 task_id
                FROM workspace_tasks
                WHERE workspace_id = ? AND created_by = ?
                ORDER BY created_at DESC, task_id DESC
                """, workspaceId, userId);
        logActivity(workspaceId, userId, "TASK_CREATED", "TASK", taskId, "created a task");
        return findTask(workspaceId, taskId);
    }

    @Transactional
    public WorkspaceTaskDto updateTask(Long workspaceId, Long userId, Long taskId, UpdateWorkspaceTaskRequest request) {
        ensureCanContribute(workspaceId, userId);
        WorkspaceTaskDto current = findTask(workspaceId, taskId);
        Long assignedTo = request.assignedTo() == null ? current.assignedTo() : request.assignedTo();
        if (assignedTo != null) {
            ensureMember(workspaceId, assignedTo);
        }
        String status = request.status() == null ? current.status() : normalizeTaskStatus(request.status());
        jdbcTemplate.update("""
                UPDATE workspace_tasks
                SET title = ?, description = ?, assigned_to = ?, status = ?, deadline_at = ?, updated_at = SYSDATETIME()
                WHERE workspace_id = ? AND task_id = ?
                """,
                request.title() == null || request.title().isBlank() ? current.title() : request.title().trim(),
                request.description() == null ? current.description() : blankToNull(request.description()),
                assignedTo,
                status,
                request.deadlineAt() == null ? current.deadlineAt() : request.deadlineAt(),
                workspaceId,
                taskId);
        touchWorkspace(workspaceId);
        logActivity(workspaceId, userId, "TASK_UPDATED", "TASK", taskId, "updated a task");
        return findTask(workspaceId, taskId);
    }

    @Transactional
    public WorkspacePostDto createPost(Long workspaceId, Long userId, CreateWorkspacePostRequest request) {
        ensureCanContribute(workspaceId, userId);
        Long attachedDocumentId = request.attachedDocumentId();
        if (attachedDocumentId != null) {
            ensureDocumentInWorkspace(workspaceId, attachedDocumentId);
        }
        boolean pinned = Boolean.TRUE.equals(request.pinned()) && isOwnerOrAdmin(workspaceId, userId);
        jdbcTemplate.update("""
                INSERT INTO workspace_posts (workspace_id, author_id, title, content, pinned, attached_document_id)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                workspaceId,
                userId,
                requiredTrim(request.title(), "Post title is required"),
                requiredTrim(request.content(), "Post content is required"),
                pinned,
                attachedDocumentId);
        touchWorkspace(workspaceId);
        Long postId = lastIdForUser("""
                SELECT TOP 1 post_id
                FROM workspace_posts
                WHERE workspace_id = ? AND author_id = ?
                ORDER BY created_at DESC, post_id DESC
                """, workspaceId, userId);
        logActivity(workspaceId, userId, "POST_CREATED", "POST", postId, "posted in discussion");
        return findPost(workspaceId, postId);
    }

    @Transactional
    public WorkspaceCommentDto createComment(
            Long workspaceId,
            Long postId,
            Long userId,
            CreateWorkspaceCommentRequest request
    ) {
        ensureCanContribute(workspaceId, userId);
        ensurePostInWorkspace(workspaceId, postId);
        jdbcTemplate.update("""
                INSERT INTO workspace_post_comments (post_id, user_id, content)
                VALUES (?, ?, ?)
                """, postId, userId, requiredTrim(request.content(), "Comment content is required"));
        touchWorkspace(workspaceId);
        Long commentId = lastIdForUser("""
                SELECT TOP 1 c.comment_id
                FROM workspace_post_comments c
                WHERE c.post_id = ? AND c.user_id = ?
                ORDER BY c.created_at DESC, c.comment_id DESC
                """, postId, userId);
        logActivity(workspaceId, userId, "COMMENT_CREATED", "COMMENT", commentId, "commented on a discussion");
        return findComment(commentId);
    }

    @Transactional
    public WorkspacePostDto setPostPinned(Long workspaceId, Long postId, Long userId, boolean pinned) {
        ensureOwnerOrAdmin(workspaceId, userId);
        ensurePostInWorkspace(workspaceId, postId);
        jdbcTemplate.update("""
                UPDATE workspace_posts
                SET pinned = ?, updated_at = SYSDATETIME()
                WHERE workspace_id = ? AND post_id = ?
                """, pinned, workspaceId, postId);
        logActivity(workspaceId, userId, pinned ? "POST_PINNED" : "POST_UNPINNED", "POST", postId,
                pinned ? "pinned a discussion" : "unpinned a discussion");
        return findPost(workspaceId, postId);
    }

    @Transactional
    public WorkspaceAiOutputDto runAi(Long workspaceId, Long userId, WorkspaceAiRequest request) {
        ensureMember(workspaceId, userId);
        String type = normalizeAiType(request.type());
        Long documentId = request.documentId();
        if (documentId != null) {
            ensureDocumentInWorkspace(workspaceId, documentId);
        }
        String prompt = buildAiPrompt(workspaceId, type, documentId, request.question());
        String result = geminiService.generateStudyContent(prompt);

        jdbcTemplate.update("""
                INSERT INTO workspace_ai_outputs (workspace_id, document_id, requested_by, output_type, prompt, result_text)
                VALUES (?, ?, ?, ?, ?, ?)
                """, workspaceId, documentId, userId, type, blankToNull(request.question()), result);
        Long outputId = lastIdForUser("""
                SELECT TOP 1 output_id
                FROM workspace_ai_outputs
                WHERE workspace_id = ? AND requested_by = ?
                ORDER BY created_at DESC, output_id DESC
                """, workspaceId, userId);

        if ("QUIZ".equals(type)) {
            createQuizFromAi(workspaceId, documentId, userId, result);
        } else if ("FLASHCARD".equals(type)) {
            createFlashcardsFromAi(workspaceId, documentId, userId, result);
        }

        logActivity(workspaceId, userId, "AI_OUTPUT_CREATED", "AI", outputId, "generated " + type.toLowerCase(Locale.ROOT).replace("_", " "));
        return findAiOutput(outputId);
    }

    @Transactional
    public WorkspaceQuizDto completeQuiz(Long workspaceId, Long quizId, Long userId, WorkspaceQuizAttemptRequest request) {
        ensureMember(workspaceId, userId);
        ensureQuizInWorkspace(workspaceId, quizId);
        BigDecimal score = request.score() == null ? BigDecimal.ZERO : request.score();
        jdbcTemplate.update("""
                INSERT INTO workspace_quiz_attempts (quiz_id, user_id, score, answers_json)
                VALUES (?, ?, ?, ?)
                """, quizId, userId, score, blankToNull(request.answersJson()));
        logActivity(workspaceId, userId, "QUIZ_COMPLETED", "QUIZ", quizId, "completed a quiz");
        return listQuizzes(workspaceId, userId).stream()
                .filter(quiz -> quiz.id().equals(quizId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Quiz not found"));
    }

    @Transactional
    public WorkspaceFlashcardSetDto updateFlashcardProgress(
            Long workspaceId,
            Long setId,
            Long userId,
            WorkspaceFlashcardProgressRequest request
    ) {
        ensureMember(workspaceId, userId);
        ensureFlashcardSetInWorkspace(workspaceId, setId);
        int reviewedCount = request.reviewedCount() == null ? 0 : request.reviewedCount();
        int totalCount = request.totalCount() == null ? 0 : request.totalCount();
        int updated = jdbcTemplate.update("""
                UPDATE workspace_flashcard_progress
                SET reviewed_count = ?, total_count = ?, updated_at = SYSDATETIME()
                WHERE set_id = ? AND user_id = ?
                """, reviewedCount, totalCount, setId, userId);
        if (updated == 0) {
            jdbcTemplate.update("""
                    INSERT INTO workspace_flashcard_progress (set_id, user_id, reviewed_count, total_count)
                    VALUES (?, ?, ?, ?)
                    """, setId, userId, reviewedCount, totalCount);
        }
        logActivity(workspaceId, userId, "FLASHCARD_REVIEWED", "FLASHCARD", setId, "updated flashcard progress");
        return listFlashcardSets(workspaceId, userId).stream()
                .filter(set -> set.id().equals(setId))
                .findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Flashcard set not found"));
    }

    public void ensureMember(Long workspaceId, Long userId) {
        roleFor(workspaceId, userId);
    }

    private WorkspaceDto findWorkspace(Long workspaceId, Long userId) {
        ensureMember(workspaceId, userId);
        return jdbcTemplate.query(workspaceSelect() + """
                WHERE w.workspace_id = ? AND w.status = 'ACTIVE'
                """, workspaceMapper, workspaceId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Workspace not found"));
    }

    private WorkspaceTaskDto findTask(Long workspaceId, Long taskId) {
        return jdbcTemplate.query(taskSelect() + """
                WHERE wt.workspace_id = ? AND wt.task_id = ?
                """, taskMapper, workspaceId, taskId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Task not found"));
    }

    private WorkspacePostDto findPost(Long workspaceId, Long postId) {
        return queryPosts("""
                WHERE p.workspace_id = ? AND p.post_id = ? AND p.status = 'ACTIVE'
                """, workspaceId, postId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Post not found"));
    }

    private WorkspaceCommentDto findComment(Long commentId) {
        return jdbcTemplate.query("""
                SELECT c.comment_id, c.post_id, c.user_id, u.full_name, u.avatar_url, c.content, c.created_at
                FROM workspace_post_comments c
                INNER JOIN users u ON u.user_id = c.user_id
                WHERE c.comment_id = ?
                """, commentMapper, commentId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comment not found"));
    }

    private WorkspaceAiOutputDto findAiOutput(Long outputId) {
        return jdbcTemplate.query(aiOutputSelect() + """
                WHERE o.output_id = ?
                """, aiOutputMapper, outputId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "AI output not found"));
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
                       ) AS message_count,
                       (
                           SELECT COUNT(*)
                           FROM workspace_tasks task
                           WHERE task.workspace_id = wm.workspace_id AND task.created_by = wm.user_id
                       ) AS task_count,
                       (
                           SELECT COUNT(*)
                           FROM workspace_posts post
                           WHERE post.workspace_id = wm.workspace_id AND post.author_id = wm.user_id AND post.status = 'ACTIVE'
                       ) AS post_count,
                       (
                           SELECT COUNT(*)
                           FROM workspace_post_comments comment
                           INNER JOIN workspace_posts post ON post.post_id = comment.post_id
                           WHERE post.workspace_id = wm.workspace_id AND comment.user_id = wm.user_id AND post.status = 'ACTIVE'
                       ) AS comment_count
                FROM workspace_members wm
                INNER JOIN users u ON u.user_id = wm.user_id
                WHERE wm.workspace_id = ?
                ORDER BY ((
                           SELECT COUNT(*)
                           FROM workspace_documents wd
                           WHERE wd.workspace_id = wm.workspace_id AND wd.added_by = wm.user_id
                       ) * 4 + (
                           SELECT COUNT(*)
                           FROM workspace_posts post
                           WHERE post.workspace_id = wm.workspace_id AND post.author_id = wm.user_id AND post.status = 'ACTIVE'
                       ) * 3 + (
                           SELECT COUNT(*)
                           FROM workspace_post_comments comment
                           INNER JOIN workspace_posts post ON post.post_id = comment.post_id
                           WHERE post.workspace_id = wm.workspace_id AND comment.user_id = wm.user_id AND post.status = 'ACTIVE'
                       ) * 2 + (
                           SELECT COUNT(*)
                           FROM workspace_messages msg
                           WHERE msg.workspace_id = wm.workspace_id AND msg.user_id = wm.user_id
                       )) DESC,
                       wm.joined_at ASC
                """, memberMapper, workspaceId);
    }

    private List<WorkspaceDocumentDto> listDocuments(Long workspaceId) {
        return jdbcTemplate.query("""
                SELECT d.document_id, d.owner_id, owner.full_name AS owner_name,
                       d.subject_id, s.subject_name, d.category_id, c.category_name,
                       d.title, d.description, d.original_file_name, d.file_url, d.preview_url,
                       d.file_type, d.file_size, d.visibility, d.status,
                       CASE COALESCE(dc.extraction_status, 'PENDING')
                           WHEN 'SUCCESS' THEN 'PROCESSED'
                           WHEN 'FAILED' THEN 'ERROR'
                           ELSE 'PROCESSING'
                       END AS processing_status,
                       wd.added_by, added.full_name AS added_by_name, wd.created_at AS added_at,
                       d.created_at, d.updated_at
                FROM workspace_documents wd
                INNER JOIN documents d ON d.document_id = wd.document_id
                INNER JOIN users owner ON owner.user_id = d.owner_id
                INNER JOIN users added ON added.user_id = wd.added_by
                LEFT JOIN subjects s ON s.subject_id = d.subject_id
                LEFT JOIN categories c ON c.category_id = d.category_id
                LEFT JOIN document_contents dc ON dc.document_id = d.document_id
                WHERE wd.workspace_id = ? AND d.status <> 'DELETED'
                ORDER BY wd.created_at DESC
                """, documentMapper, workspaceId);
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

    private List<WorkspaceTaskDto> listTasks(Long workspaceId) {
        return jdbcTemplate.query(taskSelect() + """
                WHERE wt.workspace_id = ?
                ORDER BY
                    CASE wt.status WHEN 'TODO' THEN 0 WHEN 'IN_PROGRESS' THEN 1 ELSE 2 END,
                    CASE WHEN wt.deadline_at IS NULL THEN 1 ELSE 0 END,
                    wt.deadline_at ASC,
                    wt.created_at DESC
                """, taskMapper, workspaceId);
    }

    private List<WorkspacePostDto> listPosts(Long workspaceId) {
        return queryPosts("""
                WHERE p.workspace_id = ? AND p.status = 'ACTIVE'
                ORDER BY p.pinned DESC, p.created_at DESC
                """, workspaceId);
    }

    private List<WorkspacePostDto> queryPosts(String suffix, Object... args) {
        return jdbcTemplate.query("""
                SELECT p.post_id, p.workspace_id, p.author_id, u.full_name, u.avatar_url,
                       p.title, p.content, p.pinned, p.attached_document_id,
                       d.title AS attached_document_title, p.created_at, p.updated_at
                FROM workspace_posts p
                INNER JOIN users u ON u.user_id = p.author_id
                LEFT JOIN documents d ON d.document_id = p.attached_document_id
                """ + suffix, (rs, rowNum) -> {
                    Long postId = rs.getLong("post_id");
                    return new WorkspacePostDto(
                            postId,
                            rs.getLong("workspace_id"),
                            rs.getLong("author_id"),
                            rs.getString("full_name"),
                            rs.getString("avatar_url"),
                            rs.getString("title"),
                            rs.getString("content"),
                            rs.getBoolean("pinned"),
                            nullableLong(rs, "attached_document_id"),
                            rs.getString("attached_document_title"),
                            toLocalDateTime(rs.getTimestamp("created_at")),
                            toLocalDateTime(rs.getTimestamp("updated_at")),
                            listComments(postId)
                    );
                }, args);
    }

    private List<WorkspaceCommentDto> listComments(Long postId) {
        return jdbcTemplate.query("""
                SELECT c.comment_id, c.post_id, c.user_id, u.full_name, u.avatar_url, c.content, c.created_at
                FROM workspace_post_comments c
                INNER JOIN users u ON u.user_id = c.user_id
                WHERE c.post_id = ?
                ORDER BY c.created_at ASC, c.comment_id ASC
                """, commentMapper, postId);
    }

    private List<WorkspaceActivityDto> listActivities(Long workspaceId) {
        return jdbcTemplate.query("""
                SELECT TOP 40 a.activity_id, a.workspace_id, a.user_id, u.full_name, u.avatar_url,
                       a.activity_type, a.entity_type, a.entity_id, a.description, a.created_at
                FROM workspace_activity_logs a
                LEFT JOIN users u ON u.user_id = a.user_id
                WHERE a.workspace_id = ?
                ORDER BY a.created_at DESC, a.activity_id DESC
                """, activityMapper, workspaceId);
    }

    private List<WorkspaceAiOutputDto> listAiOutputs(Long workspaceId) {
        return jdbcTemplate.query(aiOutputSelect() + """
                WHERE o.workspace_id = ?
                ORDER BY o.created_at DESC, o.output_id DESC
                """, aiOutputMapper, workspaceId);
    }

    private List<WorkspaceInvitationDto> listInvitations(Long workspaceId) {
        return jdbcTemplate.query("""
                SELECT i.invitation_id, i.workspace_id, i.invited_email, i.invite_token, i.role,
                       i.invited_by, u.full_name AS invited_by_name, i.status, i.expires_at, i.created_at
                FROM workspace_invitations i
                INNER JOIN users u ON u.user_id = i.invited_by
                WHERE i.workspace_id = ?
                ORDER BY i.created_at DESC
                """, (rs, rowNum) -> new WorkspaceInvitationDto(
                rs.getLong("invitation_id"),
                rs.getLong("workspace_id"),
                rs.getString("invited_email"),
                rs.getString("invite_token"),
                inviteUrl(rs.getString("invite_token")),
                rs.getString("role"),
                rs.getLong("invited_by"),
                rs.getString("invited_by_name"),
                rs.getString("status"),
                toLocalDateTime(rs.getTimestamp("expires_at")),
                toLocalDateTime(rs.getTimestamp("created_at"))
        ), workspaceId);
    }

    private List<WorkspaceQuizDto> listQuizzes(Long workspaceId, Long userId) {
        return jdbcTemplate.query(quizSelect() + """
                WHERE q.workspace_id = ?
                ORDER BY q.created_at DESC, q.quiz_id DESC
                """, quizMapper, userId, userId, workspaceId);
    }

    private List<WorkspaceFlashcardSetDto> listFlashcardSets(Long workspaceId, Long userId) {
        return jdbcTemplate.query("""
                SELECT s.set_id, s.workspace_id, s.document_id, d.title AS document_title,
                       s.title, s.created_by, u.full_name AS created_by_name, s.cards_json,
                       p.reviewed_count, p.total_count, s.created_at
                FROM workspace_flashcard_sets s
                INNER JOIN users u ON u.user_id = s.created_by
                LEFT JOIN documents d ON d.document_id = s.document_id
                LEFT JOIN workspace_flashcard_progress p ON p.set_id = s.set_id AND p.user_id = ?
                WHERE s.workspace_id = ?
                ORDER BY s.created_at DESC, s.set_id DESC
                """, flashcardSetMapper, userId, workspaceId);
    }

    private String workspaceSelect() {
        return """
                SELECT w.workspace_id, w.name, w.description, w.invite_code, w.owner_id,
                       owner.full_name AS owner_name, w.subject_id, s.subject_name,
                       COALESCE(w.visibility, 'PRIVATE') AS visibility,
                       w.created_at, w.updated_at,
                       (
                           SELECT COUNT(*)
                           FROM workspace_members wm
                           WHERE wm.workspace_id = w.workspace_id
                       ) AS member_count,
                       (
                           SELECT COUNT(*)
                           FROM workspace_documents wd
                           INNER JOIN documents d ON d.document_id = wd.document_id
                           WHERE wd.workspace_id = w.workspace_id AND d.status <> 'DELETED'
                       ) AS document_count,
                       (
                           SELECT COUNT(*)
                           FROM workspace_messages msg
                           WHERE msg.workspace_id = w.workspace_id
                       ) + (
                           SELECT COUNT(*)
                           FROM workspace_posts post
                           WHERE post.workspace_id = w.workspace_id AND post.status = 'ACTIVE'
                       ) AS message_count
                FROM workspaces w
                INNER JOIN users owner ON owner.user_id = w.owner_id
                LEFT JOIN subjects s ON s.subject_id = w.subject_id
                """;
    }

    private String taskSelect() {
        return """
                SELECT wt.task_id, wt.workspace_id, wt.title, wt.description, wt.assigned_to,
                       assigned.full_name AS assigned_to_name, wt.created_by,
                       creator.full_name AS created_by_name, wt.status, wt.deadline_at,
                       wt.created_at, wt.updated_at
                FROM workspace_tasks wt
                INNER JOIN users creator ON creator.user_id = wt.created_by
                LEFT JOIN users assigned ON assigned.user_id = wt.assigned_to
                """;
    }

    private String aiOutputSelect() {
        return """
                SELECT o.output_id, o.workspace_id, o.document_id, d.title AS document_title,
                       o.requested_by, u.full_name AS requested_by_name,
                       o.output_type, o.prompt, o.result_text, o.created_at
                FROM workspace_ai_outputs o
                INNER JOIN users u ON u.user_id = o.requested_by
                LEFT JOIN documents d ON d.document_id = o.document_id
                """;
    }

    private String quizSelect() {
        return """
                SELECT q.quiz_id, q.workspace_id, q.document_id, d.title AS document_title,
                       q.title, q.created_by, u.full_name AS created_by_name,
                       q.questions_json, q.created_at,
                       (
                           SELECT COUNT(*)
                           FROM workspace_quiz_attempts a
                           WHERE a.quiz_id = q.quiz_id
                       ) AS attempt_count,
                       (
                           SELECT MAX(a.score)
                           FROM workspace_quiz_attempts a
                           WHERE a.quiz_id = q.quiz_id AND (? IS NULL OR a.user_id = ?)
                       ) AS best_score
                FROM workspace_quizzes q
                INNER JOIN users u ON u.user_id = q.created_by
                LEFT JOIN documents d ON d.document_id = q.document_id
                """;
    }

    private WorkspaceDto tryAcceptInvitation(String token, Long userId) {
        InvitationLookup invitation = jdbcTemplate.query("""
                SELECT TOP 1 i.invitation_id, i.workspace_id, i.invited_email, i.role, i.status, i.expires_at
                FROM workspace_invitations i
                INNER JOIN workspaces w ON w.workspace_id = i.workspace_id
                WHERE i.invite_token = ? AND w.status = 'ACTIVE'
                """, rs -> rs.next()
                ? new InvitationLookup(
                rs.getLong("invitation_id"),
                rs.getLong("workspace_id"),
                rs.getString("invited_email"),
                rs.getString("role"),
                rs.getString("status"),
                toLocalDateTime(rs.getTimestamp("expires_at")))
                : null, token);
        if (invitation == null) {
            return null;
        }
        if (!"PENDING".equals(invitation.status())) {
            return null;
        }
        if (invitation.expiresAt() != null && invitation.expiresAt().isBefore(LocalDateTime.now())) {
            jdbcTemplate.update("""
                    UPDATE workspace_invitations
                    SET status = 'EXPIRED'
                    WHERE invitation_id = ?
                    """, invitation.id());
            return null;
        }
        if (invitation.invitedEmail() != null && !invitation.invitedEmail().isBlank()) {
            String userEmail = userEmail(userId);
            if (userEmail == null || !userEmail.equalsIgnoreCase(invitation.invitedEmail())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "This invitation is for another email address");
            }
        }

        addMemberIfMissing(invitation.workspaceId(), userId, invitation.role());
        jdbcTemplate.update("""
                UPDATE workspace_invitations
                SET status = 'ACCEPTED', accepted_by = ?, accepted_at = SYSDATETIME()
                WHERE invitation_id = ?
                """, userId, invitation.id());
        touchWorkspace(invitation.workspaceId());
        logActivity(invitation.workspaceId(), userId, "INVITATION_ACCEPTED", "MEMBER", userId, "accepted a workspace invitation");
        return findWorkspace(invitation.workspaceId(), userId);
    }

    private void addMemberIfMissing(Long workspaceId, Long userId, String role) {
        Integer membershipCount = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM workspace_members
                WHERE workspace_id = ? AND user_id = ?
                """, Integer.class, workspaceId, userId);

        if (membershipCount == null || membershipCount == 0) {
            jdbcTemplate.update("""
                    INSERT INTO workspace_members (workspace_id, user_id, role)
                    VALUES (?, ?, ?)
                    """, workspaceId, userId, role);
        }
    }

    private void ensureOwner(Long workspaceId, Long userId) {
        if (!"OWNER".equals(roleFor(workspaceId, userId))) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Only the workspace owner can do this");
        }
    }

    private void ensureOwnerOrAdmin(Long workspaceId, Long userId) {
        if (!isOwnerOrAdmin(workspaceId, userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Owner or admin permission is required");
        }
    }

    private boolean isOwnerOrAdmin(Long workspaceId, Long userId) {
        String role = roleFor(workspaceId, userId);
        return "OWNER".equals(role) || "ADMIN".equals(role);
    }

    private void ensureCanContribute(Long workspaceId, Long userId) {
        String role = roleFor(workspaceId, userId);
        if ("VIEWER".equals(role)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Viewer role can only read this workspace");
        }
    }

    private String roleFor(Long workspaceId, Long userId) {
        if (workspaceId == null || userId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "workspaceId and userId are required");
        }
        String role = jdbcTemplate.query("""
                SELECT wm.role
                FROM workspace_members wm
                INNER JOIN workspaces w ON w.workspace_id = wm.workspace_id
                WHERE wm.workspace_id = ? AND wm.user_id = ? AND w.status = 'ACTIVE'
                """, rs -> rs.next() ? rs.getString("role") : null, workspaceId, userId);
        if (role == null) {
            throw new ApiException(HttpStatus.FORBIDDEN, "You are not a member of this workspace");
        }
        return role;
    }

    private void ensureDocumentInWorkspace(Long workspaceId, Long documentId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM workspace_documents wd
                INNER JOIN documents d ON d.document_id = wd.document_id
                WHERE wd.workspace_id = ? AND wd.document_id = ? AND d.status <> 'DELETED'
                """, Integer.class, workspaceId, documentId);
        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Document is not in this workspace");
        }
    }

    private void ensurePostInWorkspace(Long workspaceId, Long postId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM workspace_posts
                WHERE workspace_id = ? AND post_id = ? AND status = 'ACTIVE'
                """, Integer.class, workspaceId, postId);
        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Post not found");
        }
    }

    private void ensureQuizInWorkspace(Long workspaceId, Long quizId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM workspace_quizzes
                WHERE workspace_id = ? AND quiz_id = ?
                """, Integer.class, workspaceId, quizId);
        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Quiz not found");
        }
    }

    private void ensureFlashcardSetInWorkspace(Long workspaceId, Long setId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM workspace_flashcard_sets
                WHERE workspace_id = ? AND set_id = ?
                """, Integer.class, workspaceId, setId);
        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Flashcard set not found");
        }
    }

    private void createQuizFromAi(Long workspaceId, Long documentId, Long userId, String result) {
        jdbcTemplate.update("""
                INSERT INTO workspace_quizzes (workspace_id, document_id, title, created_by, questions_json)
                VALUES (?, ?, ?, ?, ?)
                """, workspaceId, documentId, aiGeneratedTitle("Quiz", documentId), userId, result);
    }

    private void createFlashcardsFromAi(Long workspaceId, Long documentId, Long userId, String result) {
        jdbcTemplate.update("""
                INSERT INTO workspace_flashcard_sets (workspace_id, document_id, title, created_by, cards_json)
                VALUES (?, ?, ?, ?, ?)
                """, workspaceId, documentId, aiGeneratedTitle("Flashcards", documentId), userId, result);
    }

    private String aiGeneratedTitle(String prefix, Long documentId) {
        String documentTitle = documentId == null ? null : jdbcTemplate.query("""
                SELECT title
                FROM documents
                WHERE document_id = ?
                """, rs -> rs.next() ? rs.getString("title") : null, documentId);
        return documentTitle == null || documentTitle.isBlank()
                ? prefix + " from workspace"
                : prefix + ": " + documentTitle;
    }

    private String buildAiPrompt(Long workspaceId, String type, Long documentId, String question) {
        WorkspaceDto workspace = jdbcTemplate.query(workspaceSelect() + """
                WHERE w.workspace_id = ?
                """, workspaceMapper, workspaceId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Workspace not found"));
        String documentContext = documentId == null ? "" : documentAiService.documentContext(documentId);
        String workspaceContext = buildWorkspaceContext(workspaceId);
        String userQuestion = question == null || question.isBlank() ? "" : question.trim();

        String instruction = switch (type) {
            case "SUMMARY" -> "Summarize the selected document for a study group. Use concise bullet points and list key terms.";
            case "QUIZ" -> "Create a group quiz from the selected document. Include 8 questions, answer choices if useful, and an answer key.";
            case "FLASHCARD" -> "Create a flashcard set from the selected document. Use Question: and Answer: pairs.";
            case "REVIEW_QUESTIONS" -> "Create review questions for exam preparation. Mix short answer and conceptual questions.";
            default -> "Answer the user's question using the workspace documents and discussion context.";
        };

        return """
                You are AI Study Hub Workspace Assistant.
                Workspace: %s
                Subject: %s
                Task: %s

                Workspace context:
                %s

                Selected document context:
                %s

                User request:
                %s
                """.formatted(
                workspace.name(),
                workspace.subjectName() == null ? "General" : workspace.subjectName(),
                instruction,
                workspaceContext,
                limit(documentContext, 18000),
                userQuestion.isBlank() ? "(No extra request.)" : userQuestion
        );
    }

    private String buildWorkspaceContext(Long workspaceId) {
        List<String> documents = jdbcTemplate.queryForList("""
                SELECT TOP 12 '- Document: ' + d.title + COALESCE(' | Subject: ' + s.subject_name, '')
                FROM workspace_documents wd
                INNER JOIN documents d ON d.document_id = wd.document_id
                LEFT JOIN subjects s ON s.subject_id = d.subject_id
                WHERE wd.workspace_id = ? AND d.status <> 'DELETED'
                ORDER BY wd.created_at DESC
                """, String.class, workspaceId);
        List<String> discussions = jdbcTemplate.queryForList("""
                SELECT TOP 8 '- Discussion: ' + p.title + ' - ' + LEFT(p.content, 240)
                FROM workspace_posts p
                WHERE p.workspace_id = ? AND p.status = 'ACTIVE'
                ORDER BY p.created_at DESC
                """, String.class, workspaceId);
        return String.join("\n", documents) + "\n" + String.join("\n", discussions);
    }

    private void logActivity(Long workspaceId, Long userId, String activityType, String entityType, Long entityId, String description) {
        jdbcTemplate.update("""
                INSERT INTO workspace_activity_logs (workspace_id, user_id, activity_type, entity_type, entity_id, description)
                VALUES (?, ?, ?, ?, ?, ?)
                """, workspaceId, userId, activityType, entityType, entityId, description);
    }

    private void touchWorkspace(Long workspaceId) {
        jdbcTemplate.update("""
                UPDATE workspaces SET updated_at = SYSDATETIME()
                WHERE workspace_id = ?
                """, workspaceId);
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

    private Long ensureSubjectExists(Long subjectId) {
        if (subjectId == null) {
            return null;
        }
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM subjects
                WHERE subject_id = ?
                """, Integer.class, subjectId);
        if (count == null || count == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Subject not found");
        }
        return subjectId;
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

    private String normalizeVisibility(String visibility) {
        String normalized = visibility == null || visibility.isBlank()
                ? "PRIVATE"
                : visibility.trim().toUpperCase(Locale.ROOT);
        if (!Set.of("PRIVATE", "PUBLIC").contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Visibility must be PRIVATE or PUBLIC");
        }
        return normalized;
    }

    private String normalizeInviteRole(String role) {
        String normalized = role == null || role.isBlank()
                ? "MEMBER"
                : role.trim().toUpperCase(Locale.ROOT);
        if (!INVITE_ROLES.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Role must be ADMIN, MEMBER, or VIEWER");
        }
        return normalized;
    }

    private String normalizeTaskStatus(String status) {
        String normalized = status == null || status.isBlank()
                ? "TODO"
                : status.trim().toUpperCase(Locale.ROOT);
        if (!TASK_STATUSES.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid task status");
        }
        return normalized;
    }

    private String normalizeAiType(String type) {
        String normalized = type == null || type.isBlank()
                ? "CHAT"
                : type.trim().toUpperCase(Locale.ROOT);
        if (!AI_TYPES.contains(normalized)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid AI action");
        }
        return normalized;
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

    private Long lastIdForUser(String sql, Object... args) {
        return jdbcTemplate.query(sql, rs -> rs.next() ? rs.getLong(1) : null, args);
    }

    private String userDisplayName(Long userId) {
        return jdbcTemplate.query("""
                SELECT full_name
                FROM users
                WHERE user_id = ?
                """, rs -> rs.next() ? rs.getString("full_name") : "AI Study Hub", userId);
    }

    private String userEmail(Long userId) {
        return jdbcTemplate.query("""
                SELECT email
                FROM users
                WHERE user_id = ?
                """, rs -> rs.next() ? rs.getString("email") : null, userId);
    }

    private String inviteUrl(String token) {
        return frontendUrl + "/workspaces?invite=" + token;
    }

    private String requiredTrim(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, message);
        }
        return value.trim();
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String limit(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "(No extracted text available.)";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private int estimateCardCount(String cards) {
        if (cards == null || cards.isBlank()) {
            return 0;
        }
        int questionCount = cards.split("(?i)question:").length - 1;
        if (questionCount > 0) {
            return questionCount;
        }
        int answerCount = cards.split("(?i)answer:").length - 1;
        return Math.max(answerCount, 1);
    }

    private static LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private static Long nullableLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    private static Integer nullableInt(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    private record InvitationLookup(
            Long id,
            Long workspaceId,
            String invitedEmail,
            String role,
            String status,
            LocalDateTime expiresAt
    ) {
    }
}
