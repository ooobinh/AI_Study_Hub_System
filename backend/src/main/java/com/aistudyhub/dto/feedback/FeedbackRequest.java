package com.aistudyhub.dto.feedback;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record FeedbackRequest(
        @NotNull Long userId,
        @NotBlank @Size(max = 255) String title,
        @NotBlank String content
) {
}
