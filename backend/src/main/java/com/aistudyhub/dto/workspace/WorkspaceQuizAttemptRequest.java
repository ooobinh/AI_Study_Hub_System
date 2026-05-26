package com.aistudyhub.dto.workspace;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record WorkspaceQuizAttemptRequest(
        @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal score,
        @Size(max = 8000) String answersJson
) {
}
