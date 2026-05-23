package com.aistudyhub.dto.forum;

import java.util.List;

public record ForumDetailDto(
        ForumPostDto post,
        List<ForumAnswerDto> answers
) {
}
