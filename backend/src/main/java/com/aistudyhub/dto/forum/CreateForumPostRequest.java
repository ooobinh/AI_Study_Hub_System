package com.aistudyhub.dto.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateForumPostRequest(
        @NotBlank @Size(max = 255) String title,
        String content,
        String type
) {
}
