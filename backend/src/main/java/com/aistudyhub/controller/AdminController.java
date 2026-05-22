package com.aistudyhub.controller;

import com.aistudyhub.dto.admin.AdminReportDto;
import com.aistudyhub.dto.admin.AdminUserDto;
import com.aistudyhub.dto.admin.UpdateStatusRequest;
import com.aistudyhub.dto.auth.MessageResponse;
import com.aistudyhub.dto.document.DocumentDto;
import com.aistudyhub.dto.notification.AdminNotificationRequest;
import com.aistudyhub.service.AdminService;
import com.aistudyhub.service.DocumentService;
import com.aistudyhub.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService adminService;
    private final DocumentService documentService;
    private final NotificationService notificationService;

    public AdminController(AdminService adminService, DocumentService documentService, NotificationService notificationService) {
        this.adminService = adminService;
        this.documentService = documentService;
        this.notificationService = notificationService;
    }

    @GetMapping("/users")
    public List<AdminUserDto> users() {
        return adminService.listUsers();
    }

    @PatchMapping("/users/{id}/status")
    public AdminUserDto updateUserStatus(@PathVariable Long id, @Valid @RequestBody UpdateStatusRequest request) {
        return adminService.updateUserStatus(id, request.status());
    }

    @DeleteMapping("/users/{id}")
    public MessageResponse deleteUser(@PathVariable Long id, @RequestParam Long adminId) {
        adminService.deleteUser(id, adminId);
        return new MessageResponse("Account deleted.");
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

    @PostMapping("/notifications")
    public MessageResponse sendNotification(@Valid @RequestBody AdminNotificationRequest request) {
        return notificationService.sendAdminNotification(request);
    }
}
