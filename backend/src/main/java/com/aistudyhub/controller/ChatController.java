package com.aistudyhub.controller;

import com.aistudyhub.dto.chat.ChatMessageDto;
import com.aistudyhub.dto.chat.ChatSessionDto;
import com.aistudyhub.dto.chat.CreateChatSessionRequest;
import com.aistudyhub.dto.chat.SendMessageRequest;
import com.aistudyhub.service.ChatService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping("/sessions")
    public List<ChatSessionDto> sessions(@RequestParam Long userId) {
        return chatService.listSessions(userId);
    }

    @PostMapping("/sessions")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatSessionDto createSession(@Valid @RequestBody CreateChatSessionRequest request) {
        return chatService.createSession(request);
    }

    @GetMapping("/sessions/{sessionId}/messages")
    public List<ChatMessageDto> messages(@PathVariable Long sessionId) {
        return chatService.listMessages(sessionId);
    }

    @PostMapping("/sessions/{sessionId}/messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageDto sendUserMessage(@PathVariable Long sessionId, @Valid @RequestBody SendMessageRequest request) {
        return chatService.sendUserMessage(sessionId, request);
    }

    @PostMapping("/sessions/{sessionId}/ai-messages")
    @ResponseStatus(HttpStatus.CREATED)
    public ChatMessageDto addAiMessage(@PathVariable Long sessionId, @Valid @RequestBody SendMessageRequest request) {
        return chatService.addAiMessage(sessionId, request);
    }
}
