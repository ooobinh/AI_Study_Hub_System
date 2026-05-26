package com.aistudyhub.dto.workspace;

import java.time.LocalDateTime;

public record WorkspaceInvitationDto(
        Long id,
        Long workspaceId,
        String invitedEmail,
        String inviteToken,
        String inviteUrl,
        String role,
        Long invitedBy,
        String invitedByName,
        String status,
        LocalDateTime expiresAt,
        LocalDateTime createdAt
) {
}
