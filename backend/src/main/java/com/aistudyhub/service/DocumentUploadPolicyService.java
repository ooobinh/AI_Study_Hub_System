package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Set;

@Service
public class DocumentUploadPolicyService {
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "doc", "docx", "ppt", "pptx");
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );

    private final long maxFileSizeBytes;

    public DocumentUploadPolicyService(
            @Value("${app.upload.max-document-size-bytes:52428800}") long maxFileSizeBytes
    ) {
        this.maxFileSizeBytes = maxFileSizeBytes;
    }

    public void validateDocumentFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        if (file.getSize() > maxFileSizeBytes) {
            long maxMb = Math.max(1, maxFileSizeBytes / (1024 * 1024));
            throw new ApiException(HttpStatus.BAD_REQUEST, "File exceeds maximum size of " + maxMb + " MB");
        }

        String originalName = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
        String extension = extensionOf(originalName);
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Only PDF, DOC, DOCX, PPT, and PPTX files are allowed");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!contentType.isBlank() && !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported file type");
        }
    }

    public long maxFileSizeBytes() {
        return maxFileSizeBytes;
    }

    private String extensionOf(String fileName) {
        int dot = fileName.lastIndexOf('.');
        if (dot < 0 || dot == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
