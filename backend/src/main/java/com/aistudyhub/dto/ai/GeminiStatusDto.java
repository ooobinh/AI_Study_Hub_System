package com.aistudyhub.dto.ai;

public record GeminiStatusDto(
        Boolean configured,
        Boolean reachable,
        String model,
        String message
) {
}
