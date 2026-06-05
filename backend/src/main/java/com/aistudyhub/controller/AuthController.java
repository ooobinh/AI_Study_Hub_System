package com.aistudyhub.controller;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.auth.AccountActionResultDto;
import com.aistudyhub.dto.auth.AccountActionUserRequest;
import com.aistudyhub.dto.auth.AccountSecurityDto;
import com.aistudyhub.dto.auth.AuthResponse;
import com.aistudyhub.dto.auth.ChangeEmailRequest;
import com.aistudyhub.dto.auth.ChangePasswordRequest;
import com.aistudyhub.dto.auth.ForgotPasswordRequest;
import com.aistudyhub.dto.auth.GithubLoginRequest;
import com.aistudyhub.dto.auth.GoogleLoginRequest;
import com.aistudyhub.dto.auth.LinkGoogleAccountRequest;
import com.aistudyhub.dto.auth.LoginRequest;
import com.aistudyhub.dto.auth.MessageResponse;
import com.aistudyhub.dto.auth.RegisterRequest;
import com.aistudyhub.dto.auth.ResetPasswordRequest;
import com.aistudyhub.dto.auth.UpdateProfileRequest;
import com.aistudyhub.dto.auth.UserDto;
import com.aistudyhub.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final Path uploadDir;

    public AuthController(AuthService authService, @Value("${app.upload.dir}") String uploadDir) {
        this.authService = authService;
        this.uploadDir = Path.of(uploadDir).toAbsolutePath().normalize();
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/google")
    public AuthResponse googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        return authService.googleLogin(request);
    }

    @PostMapping("/github")
    public AuthResponse githubLogin(@Valid @RequestBody GithubLoginRequest request) {
        return authService.githubLogin(request);
    }

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        return authService.forgotPassword(request, resolveFrontendUrl(httpRequest));
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }

    @GetMapping("/verify-email")
    public MessageResponse verifyEmail(@RequestParam String token) {
        return authService.verifyEmail(token);
    }

    @GetMapping("/users/{id}")
    public UserDto user(@PathVariable Long id) {
        return authService.findById(id);
    }

    @PatchMapping("/users/{id}")
    public UserDto updateProfile(@PathVariable Long id, @Valid @RequestBody UpdateProfileRequest request) {
        return authService.updateProfile(id, request);
    }

    @PostMapping("/users/{id}/avatar")
    public UserDto uploadAvatar(
            @PathVariable Long id,
            @RequestParam MultipartFile file,
            HttpServletRequest request
    ) {
        if (file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Avatar file is empty");
        }

        String contentType = file.getContentType() == null ? "" : file.getContentType();
        if (!contentType.startsWith("image/")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Avatar must be an image file");
        }

        if (file.getSize() > 5 * 1024 * 1024) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Avatar must be 5MB or smaller");
        }

        String originalName = file.getOriginalFilename() == null ? "avatar" : file.getOriginalFilename();
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._() -]", "_");
        String storedName = UUID.randomUUID() + "-" + safeName;
        Path userDir = uploadDir.resolve("avatars").resolve(String.valueOf(id)).normalize();
        Path target = userDir.resolve(storedName).normalize();

        if (!target.startsWith(uploadDir)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Invalid avatar path");
        }

        try {
            Files.createDirectories(userDir);
            file.transferTo(target);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save avatar");
        }

        String baseUrl = request.getRequestURL().toString().replace(request.getRequestURI(), "");
        String avatarUrl = baseUrl + "/uploads/avatars/" + id + "/" + storedName;
        return authService.updateAvatar(id, avatarUrl);
    }

    @DeleteMapping("/users/{id}/avatar")
    public UserDto deleteAvatar(@PathVariable Long id) {
        return authService.removeAvatar(id);
    }

    private String resolveFrontendUrl(HttpServletRequest request) {
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            return trimTrailingSlash(origin);
        }

        String forwardedProto = request.getHeader("X-Forwarded-Proto");
        String forwardedHost = request.getHeader("X-Forwarded-Host");
        if (forwardedProto != null && !forwardedProto.isBlank()
                && forwardedHost != null && !forwardedHost.isBlank()) {
            return trimTrailingSlash(forwardedProto + "://" + forwardedHost);
        }

        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isBlank()) {
            int pathStart = referer.indexOf("/", referer.indexOf("//") + 2);
            return trimTrailingSlash(pathStart > 0 ? referer.substring(0, pathStart) : referer);
        }

        return null;
    }

    private String trimTrailingSlash(String value) {
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
