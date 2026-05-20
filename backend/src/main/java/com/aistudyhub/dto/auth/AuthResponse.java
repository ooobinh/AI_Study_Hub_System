package com.aistudyhub.dto.auth;

public record AuthResponse(
        String token,
        UserDto user
) {
}
