package com.aistudyhub.controller;

import com.aistudyhub.dto.auth.UserDto;
import com.aistudyhub.dto.document.DocumentDto;
import com.aistudyhub.service.AuthService;
import com.aistudyhub.service.DocumentService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AuthService authService;
    private final DocumentService documentService;

    public AdminController(AuthService authService, DocumentService documentService) {
        this.authService = authService;
        this.documentService = documentService;
    }

    @GetMapping("/users")
    public List<UserDto> users() {
        return authService.listUsers();
    }

    @GetMapping("/documents/pending")
    public List<DocumentDto> pendingDocuments() {
        return documentService.pendingReview();
    }
}
