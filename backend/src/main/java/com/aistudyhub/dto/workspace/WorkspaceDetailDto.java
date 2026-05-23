package com.aistudyhub.dto.workspace;

import com.aistudyhub.dto.document.DocumentDto;

import java.util.List;

public record WorkspaceDetailDto(
        WorkspaceDto workspace,
        List<WorkspaceMemberDto> members,
        List<DocumentDto> documents,
        List<WorkspaceMessageDto> messages
) {
}
