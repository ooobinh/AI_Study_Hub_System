package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.chat.ChatMessageDto;
import com.aistudyhub.dto.chat.ChatSessionDto;
import com.aistudyhub.dto.chat.CreateChatSessionRequest;
import com.aistudyhub.dto.chat.SendMessageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Service
public class ChatService {
    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<ChatSessionDto> sessionMapper = new RowMapper<>() {
        @Override
        public ChatSessionDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            long documentId = rs.getLong("document_id");
            return new ChatSessionDto(
                    rs.getLong("session_id"),
                    rs.getLong("user_id"),
                    rs.wasNull() ? null : documentId,
                    rs.getString("session_title"),
                    rs.getString("last_message"),
                    rs.getTimestamp("created_at").toLocalDateTime(),
                    rs.getTimestamp("updated_at").toLocalDateTime()
            );
        }
    };

    private final RowMapper<ChatMessageDto> messageMapper = (rs, rowNum) -> new ChatMessageDto(
            rs.getLong("message_id"),
            rs.getLong("session_id"),
            rs.getString("sender"),
            rs.getString("message_text"),
            rs.getString("ai_model"),
            rs.getTimestamp("created_at").toLocalDateTime()
    );

    public ChatService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<ChatSessionDto> listSessions(Long userId) {
        return jdbcTemplate.query("""
                SELECT cs.session_id, cs.user_id, cs.document_id, cs.session_title,
                       cs.created_at, cs.updated_at,
                       (
                           SELECT TOP 1 cm.message_text
                           FROM chat_messages cm
                           WHERE cm.session_id = cs.session_id
                           ORDER BY cm.created_at DESC
                       ) AS last_message
                FROM chat_sessions cs
                WHERE cs.user_id = ?
                ORDER BY cs.updated_at DESC
                """, sessionMapper, userId);
    }

    @Transactional
    public ChatSessionDto createSession(CreateChatSessionRequest request) {
        String title = request.sessionTitle() == null || request.sessionTitle().isBlank()
                ? "New Study Chat"
                : request.sessionTitle();

        jdbcTemplate.update("""
                INSERT INTO chat_sessions (user_id, document_id, session_title)
                VALUES (?, ?, ?)
                """, request.userId(), request.documentId(), title);

        Long id = jdbcTemplate.query("""
                SELECT TOP 1 session_id
                FROM chat_sessions
                WHERE user_id = ?
                ORDER BY created_at DESC
                """, rs -> rs.next() ? rs.getLong("session_id") : null, request.userId());

        return findSession(id);
    }

    public ChatSessionDto findSession(Long sessionId) {
        return jdbcTemplate.query("""
                SELECT cs.session_id, cs.user_id, cs.document_id, cs.session_title,
                       cs.created_at, cs.updated_at,
                       (
                           SELECT TOP 1 cm.message_text
                           FROM chat_messages cm
                           WHERE cm.session_id = cs.session_id
                           ORDER BY cm.created_at DESC
                       ) AS last_message
                FROM chat_sessions cs
                WHERE cs.session_id = ?
                """, sessionMapper, sessionId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Chat session not found"));
    }

    public List<ChatMessageDto> listMessages(Long sessionId) {
        return jdbcTemplate.query("""
                SELECT message_id, session_id, sender, message_text, ai_model, created_at
                FROM chat_messages
                WHERE session_id = ?
                ORDER BY created_at ASC
                """, messageMapper, sessionId);
    }

    @Transactional
    public ChatMessageDto sendUserMessage(Long sessionId, SendMessageRequest request) {
        findSession(sessionId);
        jdbcTemplate.update("""
                INSERT INTO chat_messages (session_id, sender, message_text, ai_model)
                VALUES (?, 'USER', ?, NULL)
                """, sessionId, request.messageText());
        touchSession(sessionId);
        return latestMessage(sessionId);
    }

    @Transactional
    public ChatMessageDto addAiMessage(Long sessionId, SendMessageRequest request) {
        findSession(sessionId);
        jdbcTemplate.update("""
                INSERT INTO chat_messages (session_id, sender, message_text, ai_model)
                VALUES (?, 'AI', ?, ?)
                """, sessionId, request.messageText(), request.aiModel());
        touchSession(sessionId);
        return latestMessage(sessionId);
    }

    private ChatMessageDto latestMessage(Long sessionId) {
        return jdbcTemplate.query("""
                SELECT TOP 1 message_id, session_id, sender, message_text, ai_model, created_at
                FROM chat_messages
                WHERE session_id = ?
                ORDER BY created_at DESC
                """, messageMapper, sessionId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Message was not created"));
    }

    private void touchSession(Long sessionId) {
        jdbcTemplate.update("UPDATE chat_sessions SET updated_at = SYSDATETIME() WHERE session_id = ?", sessionId);
    }
}
