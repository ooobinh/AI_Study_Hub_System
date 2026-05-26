package com.aistudyhub.dto.workspace;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public record InviteWorkspaceMemberRequest(
        @Email @Size(max = 255) String email,
        @Size(max = 20) String role
) {
}
