package com.aistudyhub.controller;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.document.CreateDocumentRequest;
import com.aistudyhub.dto.document.DocumentDto;
import com.aistudyhub.dto.document.StorageStatusDto;
import com.aistudyhub.service.DocumentAiService;
import com.aistudyhub.service.DocumentService;
import com.aistudyhub.service.SupabaseStorageService;
import com.aistudyhub.service.WorkspaceService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
public class UploadController {
    private final DocumentService documentService;
    private final DocumentAiService documentAiService;
    private final SupabaseStorageService supabaseStorageService;
    private final WorkspaceService workspaceService;
    private final Path uploadDir;

    public UploadController(
            DocumentService documentService,
            DocumentAiService documentAiService,
            SupabaseStorageService supabaseStorageService,
            WorkspaceService workspaceService,
            @Value("${app.upload.dir}") String uploadDir
    ) {
        this.documentService = documentService;
        this.documentAiService = documentAiService;
        this.supabaseStorageService = supabaseStorageService;
        this.workspaceService = workspaceService;
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    @GetMapping("/storage/status")
    public StorageStatusDto storageStatus() {
        return new StorageStatusDto(
                "supabase",
                supabaseStorageService.bucketName(),
                supabaseStorageService.isConfigured(),
                supabaseStorageService.isBucketReachable()
        );
    }

    @PostMapping("/documents")
    public DocumentDto uploadDocument(
            @RequestParam Long ownerId,
            @RequestParam(required = false) Long workspaceId,
            @RequestParam(required = false) Long folderId,
            @RequestParam MultipartFile file,
            HttpServletRequest request
    ) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        String originalName = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
        String title = originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf('.'))
                : originalName;
        byte[] fileBytes;

        try {
            fileBytes = file.getBytes();
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read uploaded file");
        }

        if (supabaseStorageService.isConfigured()) {
            SupabaseStorageService.StoredFile storedFile = supabaseStorageService.uploadDocument(ownerId, file);
            DocumentDto document = documentService.create(new CreateDocumentRequest(
                    ownerId,
                    null,
                    null,
                    title,
                    "",
                    originalName,
                    storedFile.fileUrl(),
                    storedFile.fileUrl(),
                    file.getContentType(),
                    file.getSize(),
                    null,
                    "PRIVATE",
                    folderId
            ));
            DocumentDto processed = documentAiService.processUploadedDocument(document, fileBytes);
            attachToWorkspaceIfNeeded(workspaceId, processed.id(), ownerId);
            return processed;
        }

        String safeName = originalName.replaceAll("[^a-zA-Z0-9._() -]", "_");
        String storedName = UUID.randomUUID() + "-" + safeName;
        Path userDir = uploadDir.resolve("documents").resolve(String.valueOf(ownerId)).normalize();
        Path target = userDir.resolve(storedName).normalize();

        if (!target.startsWith(uploadDir)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid file path");
        }

        try {
            Files.createDirectories(userDir);
            file.transferTo(target);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save uploaded file");
        }

        String baseUrl = request.getRequestURL().toString().replace(request.getRequestURI(), "");
        String fileUrl = baseUrl + "/uploads/documents/" + ownerId + "/" + storedName;

        DocumentDto document = documentService.create(new CreateDocumentRequest(
                ownerId,
                null,
                null,
                title,
                "",
                originalName,
                fileUrl,
                fileUrl,
                file.getContentType(),
                file.getSize(),
                null,
                "PRIVATE",
                folderId
        ));
        DocumentDto processed = documentAiService.processUploadedDocument(document, fileBytes);
        attachToWorkspaceIfNeeded(workspaceId, processed.id(), ownerId);
        return processed;
    }

    private void attachToWorkspaceIfNeeded(Long workspaceId, Long documentId, Long ownerId) {
        if (workspaceId != null) {
            workspaceService.addDocument(workspaceId, documentId, ownerId);
        }
    }
}
