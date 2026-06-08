package com.aistudyhub.dto.auth;

import jakarta.validation.constraints.NotBlank;

public record GithubLoginRequest(
        @NotBlank(message = "GitHub code is required")
        String code,

        @NotBlank(message = "GitHub redirect URI is required")
        String redirectUri
) {
}
