package com.aistudyhub.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Size(max = 100) String fullName,
        @NotBlank @Email @Size(max = 150) String email,
        @NotBlank
        @Size(min = 8, max = 100, message = "Password is too weak. Use at least 8 characters with letters and numbers.")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "Password is too weak. Use at least 8 characters with letters and numbers.")
        String password,
        @Size(max = 150) String university,
        @Size(max = 150) String major
) {
}
