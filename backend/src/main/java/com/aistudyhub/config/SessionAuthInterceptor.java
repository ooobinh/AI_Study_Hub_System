package com.aistudyhub.config;

import com.aistudyhub.dto.auth.SessionStatusDto;
import com.aistudyhub.service.SessionService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SessionAuthInterceptor implements HandlerInterceptor {
    private static final Pattern AUTH_USER_PATH = Pattern.compile("^/api/auth/users/(\\d+)(?:/.*)?$");

    private final SessionService sessionService;
    private final ObjectMapper objectMapper;

    public SessionAuthInterceptor(SessionService sessionService, ObjectMapper objectMapper) {
        this.sessionService = sessionService;
        this.objectMapper = objectMapper;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String path = request.getRequestURI();
        if (isPublicPath(request.getMethod(), path)) {
            return true;
        }

        String sessionId = SessionService.extractBearerToken(request.getHeader("Authorization"));
        if (sessionId == null) {
            return unauthorized(response, "Session required. Please sign in again.");
        }

        SessionStatusDto session;
        try {
            session = sessionService.validateAndTouch(sessionId);
        } catch (RuntimeException exception) {
            return unauthorized(response, exception.getMessage());
        }

        request.setAttribute(SessionService.REQUEST_USER_ID, session.userId());
        if (!userIdParamsMatch(request, session.userId()) || !pathUserIdMatches(path, session.userId())) {
            return forbidden(response, "You can only access your own account data.");
        }
        return true;
    }

    private boolean pathUserIdMatches(String path, Long authenticatedUserId) {
        if (path == null || authenticatedUserId == null) {
            return true;
        }
        Matcher matcher = AUTH_USER_PATH.matcher(path);
        if (!matcher.matches()) {
            return true;
        }
        try {
            return Long.parseLong(matcher.group(1)) == authenticatedUserId;
        } catch (NumberFormatException exception) {
            return false;
        }
    }

    private boolean userIdParamsMatch(HttpServletRequest request, Long authenticatedUserId) {
        for (String paramName : new String[] { "userId", "ownerId", "adminId" }) {
            String rawValue = request.getParameter(paramName);
            if (rawValue == null || rawValue.isBlank()) {
                continue;
            }
            try {
                long paramValue = Long.parseLong(rawValue.trim());
                if (paramValue != authenticatedUserId) {
                    return false;
                }
            } catch (NumberFormatException exception) {
                return false;
            }
        }
        return true;
    }

    private boolean isPublicPath(String method, String path) {
        if (path == null) {
            return false;
        }
        if (path.startsWith("/api/auth/register")
                || path.startsWith("/api/auth/login")
                || path.startsWith("/api/auth/google")
                || path.startsWith("/api/auth/github")
                || path.startsWith("/api/auth/forgot-password")
                || path.startsWith("/api/auth/reset-password")
                || path.startsWith("/api/auth/verify-email")
                || path.startsWith("/api/auth/account/confirm")
                || path.startsWith("/api/auth/logout")) {
            return true;
        }
        return "GET".equalsIgnoreCase(method) && path.startsWith("/api/documents/shared/");
    }

    private boolean unauthorized(HttpServletResponse response, String message) throws Exception {
        return writeJsonError(response, HttpServletResponse.SC_UNAUTHORIZED, message);
    }

    private boolean forbidden(HttpServletResponse response, String message) throws Exception {
        return writeJsonError(response, HttpServletResponse.SC_FORBIDDEN, message);
    }

    private boolean writeJsonError(HttpServletResponse response, int status, String message) throws Exception {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), Map.of("message", message));
        return false;
    }
}
