package com.aistudyhub.dto.auth;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(max = 50) String fullName,
        @Size(max = 150) String university,
        @Size(max = 150) String major
) {
}

