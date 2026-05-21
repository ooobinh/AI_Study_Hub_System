package com.aistudyhub.controller;

import com.aistudyhub.dto.document.CreateDocumentRequest;
import com.aistudyhub.dto.document.DocumentDto;
import com.aistudyhub.dto.document.DocumentPreviewDto;
import com.aistudyhub.dto.document.DocumentShareDto;
import com.aistudyhub.dto.document.UpdateDocumentRequest;
import com.aistudyhub.service.DocumentPreviewService;
import com.aistudyhub.service.DocumentService;
import com.aistudyhub.service.SupabaseStorageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@RestController
@RequestMapping("/api/documents")
public class DocumentController {
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final DocumentService documentService;
    private final DocumentPreviewService documentPreviewService;
    private final SupabaseStorageService supabaseStorageService;

    public DocumentController(
            DocumentService documentService,
            DocumentPreviewService documentPreviewService,
            SupabaseStorageService supabaseStorageService
    ) {
        this.documentService = documentService;
        this.documentPreviewService = documentPreviewService;
        this.supabaseStorageService = supabaseStorageService;
    }

    @GetMapping
    public List<DocumentDto> list(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long subjectId,
            @RequestParam(required = false) Long userId
    ) {
        return documentService.list(search, subjectId, userId);
    }

    @GetMapping("/{id}")
    public DocumentDto find(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        return documentService.findById(id, userId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentDto create(@Valid @RequestBody CreateDocumentRequest request) {
        return documentService.create(request);
    }

    @PutMapping("/{id}")
    public DocumentDto update(@PathVariable Long id, @Valid @RequestBody UpdateDocumentRequest request) {
        return documentService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        documentService.softDelete(id);
    }

    @PostMapping("/{id}/favorite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void favorite(@PathVariable Long id, @RequestParam Long userId) {
        documentService.toggleFavorite(userId, id);
    }

    @PostMapping("/{id}/view")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void view(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        documentService.recordView(id, userId);
    }

    @PostMapping("/{id}/download")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void download(@PathVariable Long id) {
        documentService.recordDownload(id);
    }

    @GetMapping("/{id}/preview")
    public DocumentPreviewDto preview(@PathVariable Long id, @RequestParam(required = false) Long userId) {
        DocumentDto document = documentService.findById(id, userId);
        documentService.recordView(id, userId);
        DownloadedDocumentFile file = downloadDocumentFile(document);
        return documentPreviewService.buildPreview(
                document.id(),
                document.originalFileName(),
                file.contentType(),
                file.content()
        );
    }

    @GetMapping("/{id}/file")
    public ResponseEntity<?> file(
            @PathVariable Long id,
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "false") boolean download
    ) {
        DocumentDto document = documentService.findById(id, userId);
        if (download) {
            documentService.recordDownload(id);
        } else {
            documentService.recordView(id, userId);
        }

        if (document.fileUrl().startsWith("supabase://")) {
            return supabaseFileResponse(document, download);
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(document.fileUrl().replace(" ", "%20")))
                .build();
    }

    @GetMapping("/shared/{token}/file")
    public ResponseEntity<?> sharedFile(
            @PathVariable String token,
            @RequestParam(defaultValue = "false") boolean download
    ) {
        DocumentDto document = documentService.findByShareToken(token);
        if (download) {
            documentService.recordDownload(document.id());
        }

        if (document.fileUrl().startsWith("supabase://")) {
            return supabaseFileResponse(document, download);
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(document.fileUrl().replace(" ", "%20")))
                .build();
    }

    @PostMapping("/{id}/share")
    public DocumentShareDto share(
            @PathVariable Long id,
            @RequestParam Long sharedBy,
            @RequestParam(defaultValue = "VIEW") String permission,
            HttpServletRequest request
    ) {
        String baseUrl = request.getRequestURL().toString().replace(request.getRequestURI(), "");
        DocumentShareDto share = documentService.createShare(id, sharedBy, permission);
        String shareUrl = baseUrl + "/api/documents/shared/" + share.shareToken() + "/file";
        return new DocumentShareDto(
                share.shareId(),
                share.documentId(),
                share.shareToken(),
                share.permission(),
                shareUrl,
                share.createdAt()
        );
    }

    private ResponseEntity<byte[]> supabaseFileResponse(DocumentDto document, boolean download) {
        SupabaseStorageService.DownloadedFile file = supabaseStorageService.download(document.fileUrl());
        String disposition = download ? "attachment" : "inline";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "%s; filename=\"%s\"".formatted(disposition, document.originalFileName()))
                .contentType(MediaType.parseMediaType(file.contentType() == null ? "application/octet-stream" : file.contentType()))
                .body(file.content());
    }

    private DownloadedDocumentFile downloadDocumentFile(DocumentDto document) {
        if (document.fileUrl().startsWith("supabase://")) {
            SupabaseStorageService.DownloadedFile file = supabaseStorageService.download(document.fileUrl());
            return new DownloadedDocumentFile(file.content(), file.contentType());
        }

        try {
            HttpRequest request = HttpRequest.newBuilder(URI.create(document.fileUrl().replace(" ", "%20")))
                    .GET()
                    .build();
            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("File request failed");
            }
            String contentType = response.headers().firstValue("content-type").orElse(document.fileType());
            return new DownloadedDocumentFile(response.body(), contentType);
        } catch (Exception exception) {
            throw new com.aistudyhub.common.ApiException(HttpStatus.BAD_GATEWAY, "Could not load document file");
        }
    }

    private record DownloadedDocumentFile(byte[] content, String contentType) {
    }
}
