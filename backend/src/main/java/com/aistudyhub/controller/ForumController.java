package com.aistudyhub.controller;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.document.CreateDocumentRequest;
import com.aistudyhub.dto.document.DocumentDto;
import com.aistudyhub.dto.forum.ActiveUserDto;
import com.aistudyhub.dto.forum.CreateForumAnswerRequest;
import com.aistudyhub.dto.forum.CreateForumPostRequest;
import com.aistudyhub.dto.forum.ForumAnswerDto;
import com.aistudyhub.dto.forum.ForumDetailDto;
import com.aistudyhub.dto.forum.ForumPostDto;
import com.aistudyhub.dto.forum.ForumRankingDto;
import com.aistudyhub.service.DocumentAiService;
import com.aistudyhub.service.DocumentService;
import com.aistudyhub.service.ForumService;
import com.aistudyhub.service.SupabaseStorageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/forum")
public class ForumController {
    private final ForumService forumService;
    private final DocumentService documentService;
    private final DocumentAiService documentAiService;
    private final SupabaseStorageService supabaseStorageService;
    private final Path uploadDir;

    public ForumController(
            ForumService forumService,
            DocumentService documentService,
            DocumentAiService documentAiService,
            SupabaseStorageService supabaseStorageService,
            @Value("${app.upload.dir}") String uploadDir
    ) {
        this.forumService = forumService;
        this.documentService = documentService;
        this.documentAiService = documentAiService;
        this.supabaseStorageService = supabaseStorageService;
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    @GetMapping("/posts")
    public List<ForumPostDto> posts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String type
    ) {
        return forumService.listPosts(search, type);
    }

    @GetMapping("/posts/{id}")
    public ForumDetailDto detail(@PathVariable Long id) {
        return forumService.detail(id);
    }

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public ForumPostDto createPost(
            @RequestParam Long authorId,
            @Valid @RequestBody CreateForumPostRequest request
    ) {
        return forumService.createPost(authorId, request);
    }

    @PostMapping("/posts/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public ForumPostDto uploadDocumentPost(
            @RequestParam Long authorId,
            @RequestParam MultipartFile file,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String content,
            HttpServletRequest request
    ) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        String originalName = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
        String defaultTitle = originalName.contains(".")
                ? originalName.substring(0, originalName.lastIndexOf('.'))
                : originalName;
        byte[] fileBytes;

        try {
            fileBytes = file.getBytes();
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read uploaded file");
        }

        DocumentDto document;
        if (supabaseStorageService.isConfigured()) {
            SupabaseStorageService.StoredFile storedFile = supabaseStorageService.uploadDocument(authorId, file);
            document = documentService.create(new CreateDocumentRequest(
                    authorId,
                    null,
                    null,
                    title == null || title.isBlank() ? defaultTitle : title.trim(),
                    content == null ? "" : content.trim(),
                    originalName,
                    storedFile.fileUrl(),
                    storedFile.fileUrl(),
                    file.getContentType(),
                    file.getSize(),
                    null,
                    "PUBLIC"
            ));
        } else {
            document = saveLocalDocument(authorId, file, originalName, defaultTitle, title, content, request);
        }

        DocumentDto processed = documentAiService.processUploadedDocument(document, fileBytes);
        return forumService.createDocumentPost(authorId, processed, title, content);
    }

    @PostMapping("/posts/{id}/answers")
    @ResponseStatus(HttpStatus.CREATED)
    public ForumAnswerDto createAnswer(
            @PathVariable Long id,
            @RequestParam Long userId,
            @Valid @RequestBody CreateForumAnswerRequest request
    ) {
        return forumService.createAnswer(id, userId, request);
    }

    @GetMapping("/rankings")
    public List<ForumRankingDto> rankings(@RequestParam(defaultValue = "week") String period) {
        return forumService.rankings(period);
    }

    @PostMapping("/presence")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void heartbeat(@RequestParam Long userId) {
        forumService.heartbeat(userId);
    }

    @GetMapping("/presence/active")
    public List<ActiveUserDto> activeUsers() {
        return forumService.activeUsers();
    }

    private DocumentDto saveLocalDocument(
            Long authorId,
            MultipartFile file,
            String originalName,
            String defaultTitle,
            String title,
            String content,
            HttpServletRequest request
    ) {
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._() -]", "_");
        String storedName = UUID.randomUUID() + "-" + safeName;
        Path userDir = uploadDir.resolve("forum").resolve(String.valueOf(authorId)).normalize();
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
        String fileUrl = baseUrl + "/uploads/forum/" + authorId + "/" + storedName;

        return documentService.create(new CreateDocumentRequest(
                authorId,
                null,
                null,
                title == null || title.isBlank() ? defaultTitle : title.trim(),
                content == null ? "" : content.trim(),
                originalName,
                fileUrl,
                fileUrl,
                file.getContentType(),
                file.getSize(),
                null,
                "PUBLIC"
        ));
    }
}
