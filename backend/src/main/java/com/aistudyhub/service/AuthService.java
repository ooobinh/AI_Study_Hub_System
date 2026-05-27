package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.auth.AuthResponse;
import com.aistudyhub.dto.auth.ForgotPasswordRequest;
import com.aistudyhub.dto.auth.GoogleLoginRequest;
import com.aistudyhub.dto.auth.LoginRequest;
import com.aistudyhub.dto.auth.MessageResponse;
import com.aistudyhub.dto.auth.RegisterRequest;
import com.aistudyhub.dto.auth.ResetPasswordRequest;
import com.aistudyhub.dto.auth.UserDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class AuthService {
    private final JdbcTemplate jdbcTemplate;
    private final ResendEmailService resendEmailService;
    private final ObjectMapper objectMapper;
    private final String frontendUrl;
    private final String googleClientId;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private final RowMapper<UserDto> userMapper = new RowMapper<>() {
        @Override
        public UserDto mapRow(ResultSet rs, int rowNum) throws SQLException {
            Long userId = rs.getLong("user_id");
            return new UserDto(
                    userId,
                    rs.getString("full_name"),
                    rs.getString("email"),
                    rs.getString("avatar_url"),
                    rs.getString("university"),
                    rs.getString("major"),
                    rs.getString("status"),
                    findRoles(userId),
                    toLocalDateTime(rs.getTimestamp("created_at"))
            );
        }
    };

    public AuthService(
            JdbcTemplate jdbcTemplate,
            ResendEmailService resendEmailService,
            ObjectMapper objectMapper,
            @Value("${app.frontend.url}") String frontendUrl,
            @Value("${app.google.client-id:}") String googleClientId
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.resendEmailService = resendEmailService;
        this.objectMapper = objectMapper;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        this.googleClientId = googleClientId;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (emailExists(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        jdbcTemplate.update("""
                INSERT INTO users (full_name, email, password_hash, university, major, status)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE')
                """,
                request.fullName(),
                request.email(),
                passwordEncoder.encode(request.password()),
                request.university(),
                request.major());

        UserDto user = findByEmail(request.email());
        assignRole(user.id(), "USER");
        return new AuthResponse(createDevelopmentToken(user.id()), findById(user.id()));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String hash = jdbcTemplate.query("""
                SELECT password_hash FROM users WHERE email = ? AND status = 'ACTIVE'
                """, rs -> rs.next() ? rs.getString("password_hash") : null, request.email());

        if (hash == null || !passwordMatches(request.email(), request.password(), hash)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        UserDto user = findByEmail(request.email());
        return new AuthResponse(createDevelopmentToken(user.id()), user);
    }

    @Transactional
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        GoogleProfile profile = verifyGoogleCredential(request.credential());
        UserDto existingUser = findByEmailAnyStatus(profile.email());

        if (existingUser != null) {
            if (!"ACTIVE".equalsIgnoreCase(existingUser.status())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "This account is not active");
            }
            refreshGoogleProfile(existingUser.id(), profile);
            UserDto user = findById(existingUser.id());
            return new AuthResponse(createDevelopmentToken(user.id()), user);
        }

        jdbcTemplate.update("""
                INSERT INTO users (full_name, email, password_hash, avatar_url, status)
                VALUES (?, ?, ?, ?, 'ACTIVE')
                """,
                profile.displayName(),
                profile.email(),
                passwordEncoder.encode(UUID.randomUUID().toString() + UUID.randomUUID()),
                profile.pictureUrl());

        UserDto user = findByEmail(profile.email());
        assignRole(user.id(), "USER");
        return new AuthResponse(createDevelopmentToken(user.id()), findById(user.id()));
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        return forgotPassword(request, null);
    }

    @Transactional
    public MessageResponse forgotPassword(ForgotPasswordRequest request, String requestFrontendUrl) {
        UserDto user = findByEmailOrNull(request.email());
        if (user == null) {
            return new MessageResponse("If that email exists, a password reset link has been sent.");
        }

        jdbcTemplate.update("""
                UPDATE password_reset_tokens
                SET used = 1
                WHERE user_id = ? AND used = 0
                """, user.id());

        String token = UUID.randomUUID().toString() + UUID.randomUUID();
        jdbcTemplate.update("""
                INSERT INTO password_reset_tokens (user_id, token, expired_at, used)
                VALUES (?, ?, DATEADD(MINUTE, 30, SYSDATETIME()), 0)
                """, user.id(), token);

        String resetUrl = resetBaseUrl(requestFrontendUrl) + "/reset-password?token=" + token;
        try {
            resendEmailService.sendPasswordResetEmail(user.email(), user.fullName(), resetUrl);
        } catch (ApiException exception) {
            return new MessageResponse("Reset link was created, but email could not be sent: " + exception.getMessage());
        }
        return new MessageResponse("If that email exists, a password reset link has been sent.");
    }

    @Transactional
    public MessageResponse resetPassword(ResetPasswordRequest request) {
        Long userId = jdbcTemplate.query("""
                SELECT user_id
                FROM password_reset_tokens
                WHERE token = ?
                  AND used = 0
                  AND expired_at > SYSDATETIME()
                """, rs -> rs.next() ? rs.getLong("user_id") : null, request.token());

        if (userId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Reset link is invalid or expired");
        }

        jdbcTemplate.update("""
                UPDATE users
                SET password_hash = ?, updated_at = SYSDATETIME()
                WHERE user_id = ?
                """, passwordEncoder.encode(request.newPassword()), userId);
        jdbcTemplate.update("""
                UPDATE password_reset_tokens
                SET used = 1
                WHERE token = ?
                """, request.token());

        return new MessageResponse("Password has been reset. You can sign in now.");
    }

    public UserDto findById(Long id) {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, email, avatar_url, university, major, status, created_at
                FROM users
                WHERE user_id = ? AND status <> 'DELETED'
                """, userMapper, id).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public List<UserDto> listUsers() {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, email, avatar_url, university, major, status, created_at
                FROM users
                WHERE status <> 'DELETED'
                ORDER BY created_at DESC
                """, userMapper);
    }

    public UserDto updateAvatar(Long id, String avatarUrl) {
        int updated = jdbcTemplate.update("""
                UPDATE users
                SET avatar_url = ?, updated_at = SYSDATETIME()
                WHERE user_id = ? AND status <> 'DELETED'
                """, avatarUrl, id);

        if (updated == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
        }

        return findById(id);
    }

    public UserDto removeAvatar(Long id) {
        int updated = jdbcTemplate.update("""
                UPDATE users
                SET avatar_url = NULL, updated_at = SYSDATETIME()
                WHERE user_id = ? AND status <> 'DELETED'
                """, id);

        if (updated == 0) {
            throw new ApiException(HttpStatus.NOT_FOUND, "User not found");
        }

        return findById(id);
    }

    private UserDto findByEmail(String email) {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, email, avatar_url, university, major, status, created_at
                FROM users
                WHERE email = ? AND status <> 'DELETED'
                """, userMapper, email).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private UserDto findByEmailOrNull(String email) {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, email, avatar_url, university, major, status, created_at
                FROM users
                WHERE email = ? AND status = 'ACTIVE'
                """, userMapper, email).stream().findFirst().orElse(null);
    }

    private UserDto findByEmailAnyStatus(String email) {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, email, avatar_url, university, major, status, created_at
                FROM users
                WHERE email = ? AND status <> 'DELETED'
                """, userMapper, email).stream().findFirst().orElse(null);
    }

    private boolean emailExists(String email) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE email = ? AND status <> 'DELETED'", Integer.class, email);
        return count != null && count > 0;
    }

    private void assignRole(Long userId, String roleName) {
        Long roleId = jdbcTemplate.query("""
                SELECT role_id FROM roles WHERE role_name = ?
                """, rs -> rs.next() ? rs.getLong("role_id") : null, roleName);

        if (roleId == null) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Role USER does not exist");
        }

        jdbcTemplate.update("""
                INSERT INTO user_roles (user_id, role_id)
                SELECT ?, ?
                WHERE NOT EXISTS (
                    SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ?
                )
                """, userId, roleId, userId, roleId);
    }

    private List<String> findRoles(Long userId) {
        return jdbcTemplate.queryForList("""
                SELECT r.role_name
                FROM roles r
                INNER JOIN user_roles ur ON ur.role_id = r.role_id
                WHERE ur.user_id = ?
                ORDER BY r.role_name
                """, String.class, userId);
    }

    private LocalDateTime toLocalDateTime(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toLocalDateTime();
    }

    private String createDevelopmentToken(Long userId) {
        return "dev-token-" + userId;
    }

    private boolean passwordMatches(String email, String rawPassword, String storedPassword) {
        if (looksLikeBcryptHash(storedPassword)) {
            return passwordEncoder.matches(rawPassword, storedPassword);
        }

        if (!storedPassword.equals(rawPassword)) {
            return false;
        }

        jdbcTemplate.update("""
                UPDATE users
                SET password_hash = ?, updated_at = SYSDATETIME()
                WHERE email = ?
                """, passwordEncoder.encode(rawPassword), email);
        return true;
    }

    private boolean looksLikeBcryptHash(String value) {
        return value.matches("^\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$");
    }

    private String resetBaseUrl(String requestFrontendUrl) {
        String value = requestFrontendUrl == null || requestFrontendUrl.isBlank()
                ? frontendUrl
                : requestFrontendUrl;
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }

    private GoogleProfile verifyGoogleCredential(String credential) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google login is not configured yet");
        }

        try {
            String encodedToken = URLEncoder.encode(credential, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodedToken))
                    .timeout(Duration.ofSeconds(12))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Google login token is invalid");
            }

            JsonNode payload = objectMapper.readTree(response.body());
            String audience = payload.path("aud").asText();
            if (!googleClientId.equals(audience)) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Google login token was issued for another app");
            }

            if (!isGoogleEmailVerified(payload.path("email_verified"))) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Google account email is not verified");
            }

            String email = payload.path("email").asText("").trim().toLowerCase();
            if (email.isBlank()) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "Google login token does not include an email");
            }

            String name = payload.path("name").asText("").trim();
            if (name.isBlank()) {
                name = email.substring(0, email.indexOf("@"));
            }

            return new GoogleProfile(
                    payload.path("sub").asText(""),
                    email,
                    name,
                    payload.path("picture").asText(null)
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Google login verification was interrupted");
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Could not verify Google login right now");
        }
    }

    private boolean isGoogleEmailVerified(JsonNode value) {
        if (value == null || value.isMissingNode() || value.isNull()) {
            return false;
        }
        return value.isBoolean() ? value.asBoolean() : "true".equalsIgnoreCase(value.asText());
    }

    private void refreshGoogleProfile(Long userId, GoogleProfile profile) {
        jdbcTemplate.update("""
                UPDATE users
                SET avatar_url = CASE
                        WHEN (avatar_url IS NULL OR LTRIM(RTRIM(CAST(avatar_url AS NVARCHAR(MAX)))) = '') THEN ?
                        ELSE avatar_url
                    END,
                    updated_at = SYSDATETIME()
                WHERE user_id = ?
                """, profile.pictureUrl(), userId);
    }

    private record GoogleProfile(
            String googleSubject,
            String email,
            String displayName,
            String pictureUrl
    ) {
    }
}
