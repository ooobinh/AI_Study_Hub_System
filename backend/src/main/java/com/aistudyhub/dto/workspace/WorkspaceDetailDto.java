package com.aistudyhub.dto.workspace;

import java.util.List;

public record WorkspaceDetailDto(
        WorkspaceDto workspace,
        List<WorkspaceMemberDto> members,
        List<WorkspaceDocumentDto> documents,
        List<WorkspaceMessageDto> messages,
        List<WorkspaceTaskDto> tasks,
        List<WorkspacePostDto> posts,
        List<WorkspaceActivityDto> activities,
        List<WorkspaceAiOutputDto> aiOutputs,
        List<WorkspaceInvitationDto> invitations,
        List<WorkspaceQuizDto> quizzes,
        List<WorkspaceFlashcardSetDto> flashcardSets
) {
}
