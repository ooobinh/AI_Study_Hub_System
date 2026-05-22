package com.aistudyhub.controller;

import com.aistudyhub.dto.admin.AdminReportDto;
import com.aistudyhub.dto.admin.AdminUserDto;
import com.aistudyhub.dto.admin.UpdateStatusRequest;
import com.aistudyhub.dto.document.DocumentDto;
import com.aistudyhub.service.AdminService;
import com.aistudyhub.service.DocumentService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;
    private final DocumentService documentService;

    public AdminController(AdminService adminService, DocumentService documentService) {
        this.adminService = adminService;
        this.documentService = documentService;
    }

    @GetMapping("/users")
    public List<AdminUserDto> users() {
        return adminService.listUsers();
    }

    @PatchMapping("/users/{id}/status")
    public AdminUserDto updateUserStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest request) {
        return adminService.updateUserStatus(id, request.status());
    }

    @GetMapping("/documents/pending")
    public List<DocumentDto> pendingDocuments() {
        return documentService.pendingReview();
    }

    @PatchMapping("/documents/{id}/status")
    public DocumentDto updateDocumentStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest request) {
        return documentService.updateStatus(id, request.status());
    }

    @GetMapping("/reports")
    public List<AdminReportDto> reports() {
        return adminService.listReports();
    }

    @PatchMapping("/reports/{id}/status")
    public AdminReportDto updateReportStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest request) {
        return adminService.updateReportStatus(id, request.status());
    }
}
