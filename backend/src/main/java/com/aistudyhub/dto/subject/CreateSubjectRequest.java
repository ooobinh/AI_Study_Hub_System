package com.aistudyhub.dto.subject;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateSubjectRequest(
        @Size(max = 50) String subjectCode,
        @NotBlank @Size(max = 150) String subjectName,
        String description
) {
}
