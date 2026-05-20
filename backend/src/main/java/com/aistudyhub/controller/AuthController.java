package com.aistudyhub.controller;

import com.aistudyhub.dto.auth.AuthResponse;
import com.aistudyhub.dto.auth.LoginRequest;
import com.aistudyhub.dto.auth.RegisterRequest;
import com.aistudyhub.dto.auth.UserDto;
import com.aistudyhub.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/users/{id}")
    public UserDto user(@PathVariable Long id) {
        return authService.findById(id);
    }
}
