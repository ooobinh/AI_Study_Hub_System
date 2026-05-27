package com.aistudyhub.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 100) String fullName,
        @Size(max = 150) String university,
        @Size(max = 150) String major
) {
}
