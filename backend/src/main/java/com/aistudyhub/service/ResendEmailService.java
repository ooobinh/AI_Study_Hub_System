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

    public void sendWorkspaceInviteEmail(String toEmail, String workspaceName, String inviterName, String inviteUrl) {
        if (!isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Resend API is not configured");
        }

        String html = """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                  <h2>You are invited to AI Study Hub</h2>
                  <p>%s invited you to join the workspace <strong>%s</strong>.</p>
                  <p><a href="%s" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none">Join workspace</a></p>
                  <p>If the button does not work, open this link:</p>
                  <p><a href="%s">%s</a></p>
                </div>
                """.formatted(escapeHtml(inviterName), escapeHtml(workspaceName), inviteUrl, inviteUrl, inviteUrl);

        sendEmail(toEmail, "AI Study Hub workspace invitation", html);
    }

    public void sendEmailVerification(String toEmail, String fullName, String verifyUrl) {
        String html = """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                  <h2>Verify your AI Study Hub email</h2>
                  <p>Hello %s,</p>
                  <p>Confirm this email address to keep your account secure and enable account recovery.</p>
                  <p><a href="%s" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none">Verify email</a></p>
                  <p>If the button does not work, open this link:</p>
                  <p><a href="%s">%s</a></p>
                  <p>This link expires in 30 minutes.</p>
                </div>
                """.formatted(escapeHtml(fullName), verifyUrl, verifyUrl, verifyUrl);

        sendEmail(toEmail, "Verify your AI Study Hub email", html);
    }

    public void sendEmailChangeConfirmation(String toEmail, String fullName, String confirmUrl) {
        String html = """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                  <h2>Confirm your new AI Study Hub email</h2>
                  <p>Hello %s,</p>
                  <p>Click the button below to confirm this email address for your AI Study Hub account.</p>
                  <p><a href="%s" style="display:inline-block;background:#2563eb;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none">Confirm new email</a></p>
                  <p>If the button does not work, open this link:</p>
                  <p><a href="%s">%s</a></p>
                  <p>This link expires in 30 minutes. If you did not request this, ignore this email.</p>
                </div>
                """.formatted(escapeHtml(fullName), confirmUrl, confirmUrl, confirmUrl);

        sendEmail(toEmail, "Confirm your AI Study Hub email change", html);
    }

    public void sendAccountDeletionConfirmation(String toEmail, String fullName, String confirmUrl) {
        String html = """
                <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
                  <h2>Confirm AI Study Hub account deletion</h2>
                  <p>Hello %s,</p>
                  <p>We received a request to delete your AI Study Hub account. This action will deactivate your login and remove personal account details.</p>
                  <p><a href="%s" style="display:inline-block;background:#dc2626;color:#ffffff;padding:12px 18px;border-radius:10px;text-decoration:none">Delete my account</a></p>
                  <p>If the button does not work, open this link:</p>
                  <p><a href="%s">%s</a></p>
                  <p>This link expires in 30 minutes. If you did not request this, keep your account safe by ignoring this email.</p>
                </div>
                """.formatted(escapeHtml(fullName), confirmUrl, confirmUrl, confirmUrl);

        sendEmail(toEmail, "Confirm AI Study Hub account deletion", html);
    }

    private void sendEmail(String toEmail, String subject, String html) {
        if (!isConfigured()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Resend API is not configured");
        }

        try {
            String body = objectMapper.writeValueAsString(new EmailRequest(
                    fromEmail,
                    List.of(toEmail),
                    subject,
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
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not send email with Resend");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Email request was interrupted");
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
