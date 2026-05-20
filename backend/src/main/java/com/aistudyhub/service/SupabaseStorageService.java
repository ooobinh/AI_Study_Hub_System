package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.UUID;

@Service
public class SupabaseStorageService {
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final String supabaseUrl;
    private final String serviceRoleKey;
    private final String bucket;

    public SupabaseStorageService(
            @Value("${app.supabase.url}") String supabaseUrl,
            @Value("${app.supabase.service-role-key}") String serviceRoleKey,
            @Value("${app.supabase.storage-bucket}") String bucket
    ) {
        this.supabaseUrl = trimTrailingSlash(supabaseUrl);
        this.serviceRoleKey = serviceRoleKey;
        this.bucket = bucket;
    }

    public boolean isConfigured() {
        return supabaseUrl != null && !supabaseUrl.isBlank()
                && serviceRoleKey != null && !serviceRoleKey.isBlank()
                && bucket != null && !bucket.isBlank();
    }

    public String bucketName() {
        return bucket == null || bucket.isBlank() ? "" : bucket;
    }

    public boolean isBucketReachable() {
        if (!isConfigured()) {
            return false;
        }

        try {
            HttpRequest request = baseRequest(bucketUri())
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() >= 200 && response.statusCode() < 300;
        } catch (IOException exception) {
            return false;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return false;
        }
    }

    public StoredFile uploadDocument(Long ownerId, MultipartFile file) {
        ensureConfigured();
        ensureBucketExists();

        String originalName = file.getOriginalFilename() == null ? "document" : file.getOriginalFilename();
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._() -]", "_");
        String objectName = "documents/%s/%s-%s".formatted(ownerId, UUID.randomUUID(), safeName);
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();

        try {
            HttpRequest request = baseRequest(storageObjectUri(objectName))
                    .header("Content-Type", contentType)
                    .header("x-upsert", "true")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(file.getBytes()))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Supabase upload failed: " + response.body());
            }

            return new StoredFile("supabase://" + objectName, objectName, contentType);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not read uploaded file");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Supabase upload was interrupted");
        }
    }

    public DownloadedFile download(String supabaseFileUrl) {
        ensureConfigured();

        String objectName = supabaseFileUrl.replaceFirst("^supabase://", "");
        try {
            HttpRequest request = baseRequest(storageObjectUri(objectName))
                    .GET()
                    .build();

            HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());
            if (response.statusCode() == 404) {
                throw new ApiException(HttpStatus.NOT_FOUND, "Supabase file not found");
            }
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "Supabase download failed");
            }

            String contentType = response.headers().firstValue("content-type").orElse("application/octet-stream");
            return new DownloadedFile(response.body(), contentType);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not download file from Supabase");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Supabase download was interrupted");
        }
    }

    private HttpRequest.Builder baseRequest(URI uri) {
        return HttpRequest.newBuilder(uri)
                .header("Authorization", "Bearer " + serviceRoleKey)
                .header("apikey", serviceRoleKey);
    }

    private void ensureBucketExists() {
        if (isBucketReachable()) {
            return;
        }

        String body = "{\"id\":\"%s\",\"name\":\"%s\",\"public\":false}".formatted(
                jsonEscape(bucket),
                jsonEscape(bucket)
        );

        try {
            HttpRequest request = baseRequest(URI.create("%s/storage/v1/bucket".formatted(supabaseUrl)))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 409 || (response.statusCode() >= 200 && response.statusCode() < 300)) {
                return;
            }
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not create Supabase bucket: " + response.body());
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Could not connect to Supabase Storage");
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Supabase bucket check was interrupted");
        }
    }

    private URI storageObjectUri(String objectName) {
        return URI.create("%s/storage/v1/object/%s/%s".formatted(
                supabaseUrl,
                encodePath(bucket),
                encodePath(objectName)
        ));
    }

    private URI bucketUri() {
        return URI.create("%s/storage/v1/bucket/%s".formatted(
                supabaseUrl,
                encodePath(bucket)
        ));
    }

    private String encodePath(String path) {
        return Arrays.stream(path.split("/"))
                .map(part -> URLEncoder.encode(part, StandardCharsets.UTF_8).replace("+", "%20"))
                .reduce((left, right) -> left + "/" + right)
                .orElse("");
    }

    private void ensureConfigured() {
        if (!isConfigured()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Supabase Storage is not configured");
        }
    }

    private String jsonEscape(String value) {
        return value == null ? "" : value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private String trimTrailingSlash(String value) {
        if (value == null) return "";
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    public record StoredFile(String fileUrl, String objectName, String contentType) {
    }

    public record DownloadedFile(byte[] content, String contentType) {
    }
}
