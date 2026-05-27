package com.aistudyhub.dto.document;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateDocumentFolderRequest(
        @NotNull Long ownerId,
        @NotBlank @Size(max = 150) String name
) {
}
