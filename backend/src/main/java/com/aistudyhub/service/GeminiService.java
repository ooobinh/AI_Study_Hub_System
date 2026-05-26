package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.ai.AiDocumentAnalysis;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class GeminiService {
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String model;
    private final String baseUrl;

    public GeminiService(
            @Value("${app.gemini.api-key}") String apiKey,
            @Value("${app.gemini.model}") String model,
            @Value("${app.gemini.base-url}") String baseUrl
    ) {
        this.apiKey = apiKey;
        this.model = model;
        this.baseUrl = baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }

    public String model() {
        return model;
    }

    public AiDocumentAnalysis analyzeDocument(String fileName, String fileType, String extractedText) {
        if (!isConfigured()) {
            return null;
        }

        String prompt = """
                You are an AI study document librarian.
                Analyze this uploaded study document and return only valid minified JSON with:
                title, description, subject, category, tags, summary.
                Rules:
                - title: concise useful study title, max 80 characters.
                - description: one sentence, max 180 characters.
                - subject: university subject name, max 80 characters.
                - category: one of Lecture Slide, Assignment, Notes, Textbook, Exam, Other.
                - tags: 3 to 6 short tags.
                - summary: 3 to 6 bullet points using plain text.

                File name: %s
                MIME type: %s
                Extracted text:
                %s
                """.formatted(fileName, fileType, limit(extractedText, 18000));

        String text = generate(prompt);
        JsonNode json = parseJson(text);
        return new AiDocumentAnalysis(
                clean(json.path("title").asText(fileName), 255),
                clean(json.path("description").asText(""), 1000),
                clean(json.path("subject").asText("General"), 150),
                clean(json.path("category").asText("Other"), 100),
                readTags(json.path("tags")),
                clean(json.path("summary").asText(""), 4000)
        );
    }

    public String answerQuestion(String question, String documentContext, List<String> recentMessages) {
        if (!isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is not configured");
        }

        String prompt = """
                You are AI Study Hub Assistant. Answer clearly and helpfully.
                If document context is provided, prioritize it. If the context does not contain the answer, say so and explain from general knowledge separately.

                Recent chat:
                %s

                Document context:
                %s

                User question:
                %s
                """.formatted(String.join("\n", recentMessages), limit(documentContext, 18000), question);

        return generate(prompt);
    }

    public String generateStudyContent(String prompt) {
        if (!isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Gemini API key is not configured");
        }
        return generate(prompt);
    }

    private String generate(String prompt) {
        try {
            String body = objectMapper.writeValueAsString(new GenerateRequest(List.of(
                    new Content(List.of(new Part(prompt)))
            )));
            String encodedModel = URLEncoder.encode(model, StandardCharsets.UTF_8).replace("+", "%20");
            HttpRequest request = HttpRequest.newBuilder(URI.create("%s/models/%s:generateContent".formatted(baseUrl, encodedModel)))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Gemini request failed: " + response.body());
            }

            JsonNode root = objectMapper.readTree(response.body());
            StringBuilder output = new StringBuilder();
            for (JsonNode candidate : root.path("candidates")) {
                for (JsonNode part : candidate.path("content").path("parts")) {
                    String text = part.path("text").asText("");
                    if (!text.isBlank()) {
                        output.append(text);
                    }
                }
            }
            if (output.isEmpty()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Gemini returned an empty response");
            }
            return output.toString().trim();
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not call Gemini API");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Gemini request was interrupted");
        }
    }

    private JsonNode parseJson(String text) {
        String cleaned = text.trim();
        if (cleaned.startsWith("```")) {
            cleaned = cleaned.replaceFirst("^```json\\s*", "").replaceFirst("^```\\s*", "").replaceFirst("\\s*```$", "");
        }
        int start = cleaned.indexOf('{');
        int end = cleaned.lastIndexOf('}');
        if (start >= 0 && end > start) {
            cleaned = cleaned.substring(start, end + 1);
        }
        try {
            return objectMapper.readTree(cleaned);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Gemini returned invalid JSON");
        }
    }

    private List<String> readTags(JsonNode tagsNode) {
        List<String> tags = new ArrayList<>();
        if (tagsNode.isArray()) {
            for (JsonNode tag : tagsNode) {
                String value = clean(tag.asText(""), 80);
                if (!value.isBlank()) {
                    tags.add(value);
                }
            }
        }
        return tags.stream().distinct().limit(6).toList();
    }

    private String clean(String value, int maxLength) {
        String cleaned = value == null ? "" : value.replaceAll("\\s+", " ").trim();
        return cleaned.length() <= maxLength ? cleaned : cleaned.substring(0, maxLength);
    }

    private String limit(String value, int maxLength) {
        if (value == null || value.isBlank()) {
            return "(No extracted text available.)";
        }
        return value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private record GenerateRequest(List<Content> contents) {
    }

    private record Content(List<Part> parts) {
    }

    private record Part(String text) {
    }
}
