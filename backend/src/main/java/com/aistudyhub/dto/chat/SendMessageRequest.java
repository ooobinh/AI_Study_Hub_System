package com.aistudyhub.dto.chat;

import jakarta.validation.constraints.NotBlank;

public record SendMessageRequest(
        @NotBlank String messageText,
        String aiModel
) {
}
