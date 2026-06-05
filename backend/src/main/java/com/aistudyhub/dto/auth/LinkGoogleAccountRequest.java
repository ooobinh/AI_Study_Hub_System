package com.aistudyhub.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record LinkGoogleAccountRequest(
        @NotNull Long userId,
        @NotBlank String credential
) {
}
