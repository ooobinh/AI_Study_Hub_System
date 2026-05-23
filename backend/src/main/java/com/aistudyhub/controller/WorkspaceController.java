package com.aistudyhub.controller;

import com.aistudyhub.dto.workspace.CreateWorkspaceMessageRequest;
import com.aistudyhub.dto.workspace.CreateWorkspaceRequest;
import com.aistudyhub.dto.workspace.JoinWorkspaceRequest;
import com.aistudyhub.dto.workspace.WorkspaceDetailDto;
import com.aistudyhub.dto.workspace.WorkspaceDto;
import com.aistudyhub.dto.workspace.WorkspaceMessageDto;
import com.aistudyhub.service.WorkspaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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

    @GetMapping("/{id}")
    public WorkspaceDetailDto detail(@PathVariable Long id, @RequestParam Long userId) {
        return workspaceService.detail(id, userId);
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
}
