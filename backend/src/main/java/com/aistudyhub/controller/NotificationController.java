package com.aistudyhub.controller;

import com.aistudyhub.dto.auth.MessageResponse;
import com.aistudyhub.dto.notification.NotificationDto;
import com.aistudyhub.service.NotificationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public List<NotificationDto> list(@RequestParam Long userId) {
        return notificationService.listForUser(userId);
    }

    @PatchMapping("/read-all")
    public MessageResponse markAllRead(@RequestParam Long userId) {
        return notificationService.markAllRead(userId);
    }

    @PatchMapping("/{id}/read")
    public NotificationDto markRead(@PathVariable Long id, @RequestParam Long userId) {
        return notificationService.markRead(id, userId);
    }
}
