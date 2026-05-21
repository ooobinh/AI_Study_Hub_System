package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

@Service
public class ResendEmailService {
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String apiKey;
    private final String fromEmail;

    public ResendEmailService(
            @Value("${app.resend.api-key}") String apiKey,
            @Value("${app.resend.from-email}") String fromEmail
    ) {
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank()
                && fromEmail != null && !fromEmail.isBlank();
    }

    public void sendPasswordResetEmail(String toEmail, String fullName, String resetUrl) {
        if (!isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Resend API is not configured");
        }

        String html = """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                  <h2>Reset your AI Study Hub password</h2>
                  <p>Hello %s,</p>
                  <p>Click the button below to create a new password. This link expires in 30 minutes.</p>
                  <p><a href="%s" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none">Create new password</a></p>
                  <p>If the button does not work, open this link:</p>
                  <p><a href="%s">%s</a></p>
                  <p>If you did not request this, you can ignore this email.</p>
                </div>
                """.formatted(escapeHtml(fullName), resetUrl, resetUrl, resetUrl);

        try {
            String body = objectMapper.writeValueAsString(new EmailRequest(
                    fromEmail,
                    List.of(toEmail),
                    "Reset your AI Study Hub password",
                    html
            ));

            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.resend.com/emails"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Resend email failed: " + response.body());
            }
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not send reset email with Resend");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Reset email request was interrupted");
        }
    }

    private String escapeHtml(String value) {
        if (value == null || value.isBlank()) {
            return "there";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private record EmailRequest(String from, List<String> to, String subject, String html) {
    }
}
