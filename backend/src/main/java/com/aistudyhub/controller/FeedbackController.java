package com.aistudyhub.controller;

import com.aistudyhub.dto.auth.MessageResponse;
import com.aistudyhub.dto.feedback.FeedbackRequest;
import com.aistudyhub.service.FeedbackService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {
    private final FeedbackService feedbackService;

    public FeedbackController(FeedbackService feedbackService) {
        this.feedbackService = feedbackService;
    }

    @PostMapping
    public MessageResponse create(@Valid @RequestBody FeedbackRequest request) {
        return feedbackService.create(request);
    }
}
