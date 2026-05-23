package com.aistudyhub.dto.forum;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateForumAnswerRequest(
        @NotBlank @Size(max = 4000) String content
) {
}
