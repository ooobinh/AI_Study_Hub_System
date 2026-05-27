package com.aistudyhub.dto.auth;

import jakarta.validation.constraints.NotNull;

public record AccountActionUserRequest(
        @NotNull Long userId
) {
}
