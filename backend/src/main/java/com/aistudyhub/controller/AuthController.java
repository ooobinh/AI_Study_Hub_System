package com.aistudyhub.controller;

import com.aistudyhub.dto.auth.AuthResponse;
import com.aistudyhub.dto.auth.ForgotPasswordRequest;
import com.aistudyhub.dto.auth.GoogleLoginRequest;
import com.aistudyhub.dto.auth.LoginRequest;
import com.aistudyhub.dto.auth.MessageResponse;
import com.aistudyhub.dto.auth.RegisterRequest;
import com.aistudyhub.dto.auth.ResetPasswordRequest;
import com.aistudyhub.dto.auth.UserDto;
import com.aistudyhub.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
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

    @PostMapping("/forgot-password")
    public MessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        return authService.forgotPassword(request, resolveFrontendUrl(httpRequest));
    }

    @PostMapping("/reset-password")
    public MessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authService.resetPassword(request);
    }

    @GetMapping("/users/{id}")
    public UserDto user(@PathVariable Long id) {
        return authService.findById(id);
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
