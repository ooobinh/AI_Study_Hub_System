package com.aistudyhub.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ChangeEmailRequest(
        @NotNull Long userId,
        @NotBlank @Email @Size(max = 150) String newEmail
) {
}
