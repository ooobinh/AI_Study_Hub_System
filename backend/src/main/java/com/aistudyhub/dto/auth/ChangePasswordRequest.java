package com.aistudyhub.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChangePasswordRequest(
        @NotNull Long userId,
        @NotBlank String currentPassword,
        @NotBlank @Size(min = 6, max = 100) String newPassword
) {
}
