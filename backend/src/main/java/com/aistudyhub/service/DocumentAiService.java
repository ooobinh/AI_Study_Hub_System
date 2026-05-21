package com.aistudyhub.service;

import com.aistudyhub.dto.ai.AiDocumentAnalysis;
import com.aistudyhub.dto.document.DocumentDto;
import com.aistudyhub.dto.document.DocumentPreviewDto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class DocumentAiService {
    private final JdbcTemplate jdbcTemplate;
    private final DocumentPreviewService documentPreviewService;
    private final GeminiService geminiService;
    private final DocumentService documentService;

    public DocumentAiService(
            JdbcTemplate jdbcTemplate,
            DocumentPreviewService documentPreviewService,
            GeminiService geminiService,
            DocumentService documentService
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.documentPreviewService = documentPreviewService;
        this.geminiService = geminiService;
        this.documentService = documentService;
    }

    @Transactional
    public DocumentDto processUploadedDocument(DocumentDto document, byte[] fileBytes) {
        String extractedText = extractText(document, fileBytes);
        saveExtractedText(document.id(), extractedText, extractedText.isBlank() ? "FAILED" : "SUCCESS");
        saveChunks(document.id(), extractedText);

        if (!geminiService.isConfigured() || extractedText.isBlank()) {
            return documentService.findById(document.id(), document.ownerId());
        }

        try {
            AiDocumentAnalysis analysis = geminiService.analyzeDocument(
                    document.originalFileName(),
                    document.fileType(),
                    extractedText
            );
            if (analysis != null) {
                applyAnalysis(document, analysis);
            }
        } catch (RuntimeException exception) {
            jdbcTemplate.update("""
                    UPDATE document_contents
                    SET extraction_status = 'FAILED', extracted_at = SYSDATETIME()
                    WHERE document_id = ?
                    """, document.id());
        }

        return documentService.findById(document.id(), document.ownerId());
    }

    public String documentContext(Long documentId) {
        if (documentId == null) {
            return "";
        }
        return jdbcTemplate.query("""
                SELECT extracted_text
                FROM document_contents
                WHERE document_id = ?
                """, rs -> rs.next() ? rs.getString("extracted_text") : "", documentId);
    }

    private String extractText(DocumentDto document, byte[] fileBytes) {
        try {
            DocumentPreviewDto preview = documentPreviewService.buildPreview(
                    document.id(),
                    document.originalFileName(),
                    document.fileType(),
                    fileBytes
            );
            return preview.content() == null ? "" : preview.content();
        } catch (RuntimeException exception) {
            return "";
        }
    }

    private void saveExtractedText(Long documentId, String extractedText, String status) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM document_contents WHERE document_id = ?",
                Integer.class,
                documentId
        );

        if (count != null && count > 0) {
            jdbcTemplate.update("""
                    UPDATE document_contents
                    SET extracted_text = ?, extraction_status = ?, extracted_at = SYSDATETIME()
                    WHERE document_id = ?
                    """, extractedText, status, documentId);
        } else {
            jdbcTemplate.update("""
                    INSERT INTO document_contents (document_id, extracted_text, extraction_status, extracted_at)
                    VALUES (?, ?, ?, SYSDATETIME())
                    """, documentId, extractedText, status);
        }
    }

    private void saveChunks(Long documentId, String text) {
        jdbcTemplate.update("DELETE FROM document_chunks WHERE document_id = ?", documentId);
        if (text == null || text.isBlank()) {
            return;
        }

        List<String> chunks = chunk(text, 2500);
        for (int i = 0; i < chunks.size(); i++) {
            jdbcTemplate.update("""
                    INSERT INTO document_chunks (document_id, chunk_index, chunk_text)
                    VALUES (?, ?, ?)
                    """, documentId, i, chunks.get(i));
        }
    }

    private void applyAnalysis(DocumentDto document, AiDocumentAnalysis analysis) {
        Long subjectId = ensureSubject(analysis.subject());
        Long categoryId = ensureCategory(analysis.category());
        String title = blankToDefault(analysis.title(), document.title());
        String description = blankToDefault(analysis.description(), document.description());

        jdbcTemplate.update("""
                UPDATE documents
                SET title = ?, description = ?, subject_id = ?, category_id = ?, updated_at = SYSDATETIME()
                WHERE document_id = ?
                """, title, description, subjectId, categoryId, document.id());

        saveTags(document.id(), analysis.tags());
        saveSummary(document.id(), document.ownerId(), analysis.summary());
    }

    private Long ensureSubject(String subject) {
        String name = blankToDefault(subject, "General");
        Long existing = jdbcTemplate.query("""
                SELECT subject_id FROM subjects WHERE subject_name = ?
                """, rs -> rs.next() ? rs.getLong("subject_id") : null, name);
        if (existing != null) {
            return existing;
        }

        String code = codeFromName(name);
        jdbcTemplate.update("""
                INSERT INTO subjects (subject_code, subject_name, description)
                VALUES (?, ?, ?)
                """, code, name, "Created by AI document classification");
        return jdbcTemplate.query("""
                SELECT subject_id FROM subjects WHERE subject_name = ?
                """, rs -> rs.next() ? rs.getLong("subject_id") : null, name);
    }

    private Long ensureCategory(String category) {
        String name = blankToDefault(category, "Other");
        Long existing = jdbcTemplate.query("""
                SELECT category_id FROM categories WHERE category_name = ?
                """, rs -> rs.next() ? rs.getLong("category_id") : null, name);
        if (existing != null) {
            return existing;
        }

        jdbcTemplate.update("""
                INSERT INTO categories (category_name, description)
                VALUES (?, ?)
                """, name, "Created by AI document classification");
        return jdbcTemplate.query("""
                SELECT category_id FROM categories WHERE category_name = ?
                """, rs -> rs.next() ? rs.getLong("category_id") : null, name);
    }

    private void saveTags(Long documentId, List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return;
        }

        for (String tag : tags) {
            String tagName = blankToDefault(tag, "").trim();
            if (tagName.isBlank()) {
                continue;
            }
            Long tagId = jdbcTemplate.query("""
                    SELECT tag_id FROM document_tags WHERE tag_name = ?
                    """, rs -> rs.next() ? rs.getLong("tag_id") : null, tagName);
            if (tagId == null) {
                jdbcTemplate.update("INSERT INTO document_tags (tag_name) VALUES (?)", tagName);
                tagId = jdbcTemplate.query("""
                        SELECT tag_id FROM document_tags WHERE tag_name = ?
                        """, rs -> rs.next() ? rs.getLong("tag_id") : null, tagName);
            }

            Integer mappingCount = jdbcTemplate.queryForObject("""
                    SELECT COUNT(*) FROM document_tag_mapping WHERE document_id = ? AND tag_id = ?
                    """, Integer.class, documentId, tagId);
            if (mappingCount == null || mappingCount == 0) {
                jdbcTemplate.update("""
                        INSERT INTO document_tag_mapping (document_id, tag_id)
                        VALUES (?, ?)
                        """, documentId, tagId);
            }
        }
    }

    private void saveSummary(Long documentId, Long userId, String summary) {
        if (summary == null || summary.isBlank()) {
            return;
        }
        jdbcTemplate.update("""
                INSERT INTO ai_summaries (document_id, user_id, summary_text)
                VALUES (?, ?, ?)
                """, documentId, userId, summary);
    }

    private List<String> chunk(String text, int chunkSize) {
        List<String> chunks = new ArrayList<>();
        for (int start = 0; start < text.length(); start += chunkSize) {
            chunks.add(text.substring(start, Math.min(text.length(), start + chunkSize)));
        }
        return chunks;
    }

    private String codeFromName(String name) {
        String base = name.toUpperCase(Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
        if (base.isBlank()) {
            base = "GENERAL";
        }
        base = base.length() <= 40 ? base : base.substring(0, 40);
        String candidate = base;
        int suffix = 1;
        while (codeExists(candidate)) {
            String number = "_" + suffix++;
            candidate = base.substring(0, Math.min(base.length(), 50 - number.length())) + number;
        }
        return candidate;
    }

    private boolean codeExists(String code) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM subjects WHERE subject_code = ?",
                Integer.class,
                code
        );
        return count != null && count > 0;
    }

    private String blankToDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }
}
