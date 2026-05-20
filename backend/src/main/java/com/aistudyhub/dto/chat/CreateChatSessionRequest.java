package com.aistudyhub.dto.chat;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateChatSessionRequest(
        @NotNull Long userId,
        Long documentId,
        @Size(max = 255) String sessionTitle
) {
}
