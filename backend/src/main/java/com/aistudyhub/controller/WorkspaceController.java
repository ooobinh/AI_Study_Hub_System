package com.aistudyhub.controller;

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
import com.aistudyhub.dto.workspace.WorkspaceAiOutputDto;
import com.aistudyhub.dto.workspace.WorkspaceAiRequest;
import com.aistudyhub.dto.workspace.WorkspaceCommentDto;
import com.aistudyhub.dto.workspace.WorkspaceDetailDto;
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
import com.aistudyhub.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/workspaces")
public class WorkspaceController {
    private final WorkspaceService workspaceService;

    public WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @GetMapping
    public List<WorkspaceDto> list(@RequestParam Long userId) {
        return workspaceService.list(userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceDto create(
            @RequestParam Long ownerId,
            @Valid @RequestBody CreateWorkspaceRequest request
    ) {
        return workspaceService.create(request, ownerId);
    }

    @PostMapping("/join")
    public WorkspaceDto join(
            @RequestParam Long userId,
            @Valid @RequestBody JoinWorkspaceRequest request
    ) {
        return workspaceService.join(request, userId);
    }

    @PostMapping("/invitations/{token}/accept")
    public WorkspaceDto acceptInvitation(@PathVariable String token, @RequestParam Long userId) {
        return workspaceService.acceptInvitation(token, userId);
    }

    @GetMapping("/{id}")
    public WorkspaceDetailDto detail(@PathVariable Long id, @RequestParam Long userId) {
        return workspaceService.detail(id, userId);
    }

    @PutMapping("/{id}")
    public WorkspaceDto update(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody UpdateWorkspaceRequest request
    ) {
        return workspaceService.update(id, userId, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteWorkspace(@PathVariable Long id, @RequestParam Long userId) {
        workspaceService.deleteWorkspace(id, userId);
    }

    @PostMapping("/{id}/leave")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void leave(@PathVariable Long id, @RequestParam Long userId) {
        workspaceService.leave(id, userId);
    }

    @PostMapping("/{id}/documents")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addDocument(
            @PathVariable Long id,
            @RequestParam Long userId,
            @RequestParam Long documentId
    ) {
        workspaceService.addDocument(id, documentId, userId);
    }

    @PostMapping("/{id}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceMessageDto createMessage(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CreateWorkspaceMessageRequest request
    ) {
        return workspaceService.createMessage(id, userId, request);
    }

    @PostMapping("/{id}/invitations")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceInvitationDto inviteMember(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody InviteWorkspaceMemberRequest request
    ) {
        return workspaceService.createInvitation(id, userId, request);
    }

    @PatchMapping("/{id}/members/{memberId}/role")
    public WorkspaceMemberDto updateMemberRole(
            @PathVariable Long id,
            @PathVariable Long memberId,
            @RequestParam Long userId,
            @Valid @RequestBody UpdateWorkspaceMemberRoleRequest request
    ) {
        return workspaceService.updateMemberRole(id, userId, memberId, request);
    }

    @DeleteMapping("/{id}/members/{memberId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(
            @PathVariable Long id,
            @PathVariable Long memberId,
            @RequestParam Long userId
    ) {
        workspaceService.removeMember(id, userId, memberId);
    }

    @PostMapping("/{id}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceTaskDto createTask(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CreateWorkspaceTaskRequest request
    ) {
        return workspaceService.createTask(id, userId, request);
    }

    @PatchMapping("/{id}/tasks/{taskId}")
    public WorkspaceTaskDto updateTask(
            @PathVariable Long id,
            @PathVariable Long taskId,
            @RequestParam Long userId,
            @Valid @RequestBody UpdateWorkspaceTaskRequest request
    ) {
        return workspaceService.updateTask(id, userId, taskId, request);
    }

    @PostMapping("/{id}/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspacePostDto createPost(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CreateWorkspacePostRequest request
    ) {
        return workspaceService.createPost(id, userId, request);
    }

    @PostMapping("/{id}/posts/{postId}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceCommentDto createComment(
            @PathVariable Long id,
            @PathVariable Long postId,
            @RequestParam Long userId,
            @Valid @RequestBody CreateWorkspaceCommentRequest request
    ) {
        return workspaceService.createComment(id, postId, userId, request);
    }

    @PatchMapping("/{id}/posts/{postId}/pin")
    public WorkspacePostDto setPostPinned(
            @PathVariable Long id,
            @PathVariable Long postId,
            @RequestParam Long userId,
            @RequestParam boolean pinned
    ) {
        return workspaceService.setPostPinned(id, postId, userId, pinned);
    }

    @PostMapping("/{id}/ai")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceAiOutputDto runAi(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody WorkspaceAiRequest request
    ) {
        return workspaceService.runAi(id, userId, request);
    }

    @PostMapping("/{id}/quizzes/{quizId}/attempts")
    @ResponseStatus(HttpStatus.CREATED)
    public WorkspaceQuizDto completeQuiz(
            @PathVariable Long id,
            @PathVariable Long quizId,
            @RequestParam Long userId,
            @Valid @RequestBody WorkspaceQuizAttemptRequest request
    ) {
        return workspaceService.completeQuiz(id, quizId, userId, request);
    }

    @PatchMapping("/{id}/flashcards/{setId}/progress")
    public WorkspaceFlashcardSetDto updateFlashcardProgress(
            @PathVariable Long id,
            @PathVariable Long setId,
            @RequestParam Long userId,
            @Valid @RequestBody WorkspaceFlashcardProgressRequest request
    ) {
        return workspaceService.updateFlashcardProgress(id, setId, userId, request);
    }
}
