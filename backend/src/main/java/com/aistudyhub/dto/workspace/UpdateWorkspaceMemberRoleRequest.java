package com.aistudyhub.dto.workspace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateWorkspaceMemberRoleRequest(
        @NotBlank @Size(max = 20) String role
) {
}
