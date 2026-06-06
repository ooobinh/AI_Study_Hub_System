package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.auth.AccountActionResultDto;
import com.aistudyhub.dto.auth.AccountSecurityDto;
import com.aistudyhub.dto.auth.AuthResponse;
import com.aistudyhub.dto.auth.ChangeEmailRequest;
import com.aistudyhub.dto.auth.ChangePasswordRequest;
import com.aistudyhub.dto.auth.ForgotPasswordRequest;
import com.aistudyhub.dto.auth.GithubLoginRequest;
import com.aistudyhub.dto.auth.GoogleLoginRequest;
import com.aistudyhub.dto.auth.LinkGoogleAccountRequest;
import com.aistudyhub.dto.auth.LoginRequest;
import com.aistudyhub.dto.auth.MessageResponse;
import com.aistudyhub.dto.auth.RegisterRequest;
import com.aistudyhub.dto.auth.ResetPasswordRequest;
import com.aistudyhub.dto.auth.UpdateProfileRequest;
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
    private final String githubClientId;
    private final String githubClientSecret;
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
            @Value("${app.google.client-id:}") String googleClientId,
            @Value("${app.github.client-id:}") String githubClientId,
            @Value("${app.github.client-secret:}") String githubClientSecret
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.resendEmailService = resendEmailService;
        this.objectMapper = objectMapper;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        this.googleClientId = googleClientId;
        this.githubClientId = githubClientId;
        this.githubClientSecret = githubClientSecret;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (emailExists(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        jdbcTemplate.update("""
                INSERT INTO users (full_name, email, password_hash, university, major, status, email_verified)
                VALUES (?, ?, ?, ?, ?, 'ACTIVE', 0)
                """,
                request.fullName(),
                request.email(),
                passwordEncoder.encode(request.password()),
                request.university(),
                request.major());

        UserDto user = findByEmail(request.email());
        assignRole(user.id(), "USER");
        createEmailVerificationToken(user.id(), user.email(), user.fullName(), null);
        return new AuthResponse(createDevelopmentToken(user.id()), findById(user.id()));
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase();
        LoginUserRow row = jdbcTemplate.query("""
                SELECT user_id, password_hash, status, email_verified, failed_login_count, locked_until
                FROM users
                WHERE email = ? AND status <> 'DELETED'
                """, rs -> rs.next()
                ? new LoginUserRow(
                        rs.getLong("user_id"),
                        rs.getString("password_hash"),
                        rs.getString("status"),
                        rs.getBoolean("email_verified"),
                        rs.getInt("failed_login_count"),
                        rs.getTimestamp("locked_until") == null ? null : rs.getTimestamp("locked_until").toLocalDateTime()
                )
                : null, email);

        if (row == null || !"ACTIVE".equalsIgnoreCase(row.status())) {
            recordLoginAttempt(email, row == null ? null : row.userId(), false, "Invalid email or password");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        if (row.lockedUntil() != null && row.lockedUntil().isAfter(LocalDateTime.now())) {
            recordLoginAttempt(email, row.userId(), false, "Account locked");
            throw new ApiException(HttpStatus.FORBIDDEN, "Account is locked. Try again later.");
        }

        if (!row.emailVerified()) {
            recordLoginAttempt(email, row.userId(), false, "Email not verified");
            throw new ApiException(HttpStatus.FORBIDDEN, "Please verify your email before signing in.");
        }

        if (row.passwordHash() == null || !passwordMatches(email, request.password(), row.passwordHash())) {
            registerFailedLogin(row.userId(), email);
            recordLoginAttempt(email, row.userId(), false, "Invalid email or password");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        clearFailedLogin(row.userId());
        recordLoginAttempt(email, row.userId(), true, "OK");
        jdbcTemplate.update("UPDATE users SET last_login_at = SYSDATETIME(), updated_at = SYSDATETIME() WHERE user_id = ?", row.userId());

        UserDto user = findById(row.userId());
        return new AuthResponse(createDevelopmentToken(user.id()), user);
    }

    @Transactional
    public AuthResponse googleLogin(GoogleLoginRequest request) {
        ensureAccountSecuritySchema();
        GoogleProfile profile = verifyGoogleCredential(request.credential());
        UserDto linkedUser = findByGoogleSubject(profile.googleSubject());
        if (linkedUser != null) {
            if (!"ACTIVE".equalsIgnoreCase(linkedUser.status())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "This account is not active");
            }
            refreshGoogleProfile(linkedUser.id(), profile);
            UserDto user = findById(linkedUser.id());
            return new AuthResponse(createDevelopmentToken(user.id()), user);
        }

        UserDto existingUser = findByEmailAnyStatus(profile.email());

        if (existingUser != null) {
            if (!"ACTIVE".equalsIgnoreCase(existingUser.status())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "This account is not active");
            }
            if (googleSubjectOwnedByDifferentUser(profile.googleSubject(), existingUser.id())) {
                throw new ApiException(HttpStatus.CONFLICT, "This Google account is already linked to another account");
            }
            refreshGoogleProfile(existingUser.id(), profile);
            jdbcTemplate.update("UPDATE users SET email_verified = 1, updated_at = SYSDATETIME() WHERE user_id = ?", existingUser.id());
            UserDto user = findById(existingUser.id());
            return new AuthResponse(createDevelopmentToken(user.id()), user);
        }

        jdbcTemplate.update("""
                INSERT INTO users (full_name, email, password_hash, avatar_url, status, email_verified)
                VALUES (?, ?, ?, ?, 'ACTIVE', 1)
                """,
                profile.displayName(),
                profile.email(),
                passwordEncoder.encode(UUID.randomUUID().toString() + UUID.randomUUID()),
                profile.pictureUrl(),
                profile.googleSubject());

        UserDto user = findByEmail(profile.email());
        assignRole(user.id(), "USER");
        return new AuthResponse(createDevelopmentToken(user.id()), findById(user.id()));
    }

    @Transactional
    public AuthResponse githubLogin(GithubLoginRequest request) {
        GithubProfile profile = fetchGithubProfile(request.code(), request.redirectUri());
        UserDto existingUser = findByEmailAnyStatus(profile.email());

        if (existingUser != null) {
            if (!"ACTIVE".equalsIgnoreCase(existingUser.status())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "This account is not active");
            }
            refreshGithubProfile(existingUser.id(), profile);
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
        markEmailVerifiedIfSupported(user.id(), profile.emailVerified());
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
                SET password_hash = ?, password_changed_at = SYSDATETIME(), updated_at = SYSDATETIME()
                WHERE user_id = ?
                """, passwordEncoder.encode(request.newPassword()), userId);
        jdbcTemplate.update("""
                UPDATE password_reset_tokens
                SET used = 1
                WHERE token = ?
                """, request.token());

        return new MessageResponse("Password has been reset. You can sign in now.");
    }

    @Transactional
    public MessageResponse verifyEmail(String token) {
        if (token == null || token.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification token is required");
        }
        ensureEmailVerificationTokenSchema();

        Long userId = jdbcTemplate.query("""
                SELECT user_id
                FROM email_verification_tokens
                WHERE token = ?
                  AND used = 0
                  AND expires_at > SYSDATETIME()
                """, rs -> rs.next() ? rs.getLong("user_id") : null, token.trim());

        if (userId == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Verification link is invalid or expired");
        }

        jdbcTemplate.update("UPDATE users SET email_verified = 1, updated_at = SYSDATETIME() WHERE user_id = ?", userId);
        jdbcTemplate.update("UPDATE email_verification_tokens SET used = 1 WHERE token = ?", token.trim());
        return new MessageResponse("Email verified. You can sign in now.");
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

    @Transactional
    public UserDto updateProfile(Long id, UpdateProfileRequest request) {
        if (id == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "User id is required");
        }
        UserDto current = findById(id);
        String nextFullName = sanitizeProfileText(request.fullName(), current.fullName());
        String nextUniversity = sanitizeProfileText(request.university(), current.university());
        String nextMajor = sanitizeProfileText(request.major(), current.major());

        int updated = jdbcTemplate.update("""
                UPDATE users
                SET full_name = ?, university = ?, major = ?, updated_at = SYSDATETIME()
                WHERE user_id = ? AND status <> 'DELETED'
                """, nextFullName, nextUniversity, nextMajor, id);

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

    private UserDto findByGoogleSubject(String googleSubject) {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, email, avatar_url, university, major, status, created_at
                FROM users
                WHERE google_subject = ? AND status <> 'DELETED'
                """, userMapper, googleSubject).stream().findFirst().orElse(null);
    }

    private boolean emailExists(String email) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE email = ? AND status <> 'DELETED'", Integer.class, email);
        return count != null && count > 0;
    }

    private boolean emailExistsForDifferentUser(String email, Long userId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM users
                WHERE LOWER(email) = LOWER(?) AND user_id <> ? AND status <> 'DELETED'
                """, Integer.class, email, userId);
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

    private void createEmailVerificationToken(Long userId, String email, String fullName, String requestFrontendUrl) {
        ensureEmailVerificationTokenSchema();
        // Invalidate previous unused tokens
        jdbcTemplate.update("UPDATE email_verification_tokens SET used = 1 WHERE user_id = ? AND used = 0", userId);

        String token = UUID.randomUUID().toString() + UUID.randomUUID();
        if (columnExists("email_verification_tokens", "expired_at")) {
            jdbcTemplate.update("""
                    INSERT INTO email_verification_tokens (user_id, token, expires_at, expired_at, used)
                    VALUES (?, ?, DATEADD(MINUTE, 30, SYSDATETIME()), DATEADD(MINUTE, 30, SYSDATETIME()), 0)
                    """, userId, token);
        } else {
            jdbcTemplate.update("""
                    INSERT INTO email_verification_tokens (user_id, token, expires_at, used)
                    VALUES (?, ?, DATEADD(MINUTE, 30, SYSDATETIME()), 0)
                    """, userId, token);
        }

        String base = requestFrontendUrl == null || requestFrontendUrl.isBlank() ? frontendUrl : requestFrontendUrl;
        String verifyUrl = base + "/verify-email?token=" + token;
        try {
            resendEmailService.sendEmailVerificationEmail(email, fullName, verifyUrl);
        } catch (ApiException exception) {
            // Do not fail registration if email cannot be sent in dev environments
        }
    }

    private void registerFailedLogin(Long userId, String email) {
        jdbcTemplate.update("""
                UPDATE users
                SET failed_login_count = failed_login_count + 1,
                    updated_at = SYSDATETIME()
                WHERE user_id = ?
                """, userId);

        Integer count = jdbcTemplate.queryForObject("SELECT failed_login_count FROM users WHERE user_id = ?", Integer.class, userId);
        if (count != null && count >= 5) {
            jdbcTemplate.update("""
                    UPDATE users
                    SET locked_until = DATEADD(MINUTE, 15, SYSDATETIME()),
                        failed_login_count = 0,
                        updated_at = SYSDATETIME()
                    WHERE user_id = ?
                    """, userId);
        }
    }

    private void clearFailedLogin(Long userId) {
        jdbcTemplate.update("""
                UPDATE users
                SET failed_login_count = 0,
                    locked_until = NULL,
                    updated_at = SYSDATETIME()
                WHERE user_id = ?
                """, userId);
    }

    private void recordLoginAttempt(String email, Long userId, boolean success, String message) {
        jdbcTemplate.update("""
                INSERT INTO auth_login_logs (email, user_id, success, ip_address, user_agent, message)
                VALUES (?, ?, ?, NULL, NULL, ?)
                """, email, userId, success ? 1 : 0, message == null ? "" : message);
    }

    private String sanitizeProfileText(String value, String fallback) {
        if (value == null) {
            return fallback;
        }
        String trimmed = value.trim();
        if (trimmed.isBlank()) {
            return "";
        }
        // Allow letters, numbers, spaces and common punctuation.
        String cleaned = trimmed.replaceAll("[^\\p{L}\\p{N} .,_@\\-()]", "");
        return cleaned.length() > 150 ? cleaned.substring(0, 150) : cleaned;
    }

    private record LoginUserRow(
            Long userId,
            String passwordHash,
            String status,
            boolean emailVerified,
            int failedLoginCount,
            LocalDateTime lockedUntil
    ) {
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

    private String accountActionUrl(String token, String requestFrontendUrl) {
        String encodedToken = URLEncoder.encode(token, StandardCharsets.UTF_8);
        return resetBaseUrl(requestFrontendUrl) + "/account/confirm?token=" + encodedToken;
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

    private GithubProfile fetchGithubProfile(String code, String redirectUri) {
        if (githubClientId == null || githubClientId.isBlank()
                || githubClientSecret == null || githubClientSecret.isBlank()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GitHub login is not configured yet");
        }

        try {
            String accessToken = exchangeGithubCode(code, redirectUri);
            JsonNode user = githubGet("https://api.github.com/user", accessToken);
            String githubId = user.path("id").asText("").trim();
            if (githubId.isBlank() || "0".equals(githubId)) {
                throw new ApiException(HttpStatus.UNAUTHORIZED, "GitHub account could not be verified");
            }

            GithubEmail githubEmail = fetchGithubEmail(accessToken, user.path("email").asText(""));
            String displayName = user.path("name").asText("").trim();
            if (displayName.isBlank()) {
                displayName = user.path("login").asText("").trim();
            }
            if (displayName.isBlank()) {
                displayName = githubEmail.email().substring(0, githubEmail.email().indexOf("@"));
            }

            return new GithubProfile(
                    githubEmail.email(),
                    displayName,
                    user.path("avatar_url").asText(null),
                    githubEmail.verified()
            );
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GitHub login verification was interrupted");
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Could not verify GitHub login right now");
        }
    }

    private String exchangeGithubCode(String code, String redirectUri) throws IOException, InterruptedException {
        String body = "client_id=" + encodeFormValue(githubClientId)
                + "&client_secret=" + encodeFormValue(githubClientSecret)
                + "&code=" + encodeFormValue(code)
                + "&redirect_uri=" + encodeFormValue(redirectUri);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://github.com/login/oauth/access_token"))
                .timeout(Duration.ofSeconds(12))
                .header("Accept", "application/json")
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "GitHub login is unavailable right now");
        }

        JsonNode payload = objectMapper.readTree(response.body());
        if (payload.hasNonNull("error")) {
            throw new ApiException(
                    HttpStatus.UNAUTHORIZED,
                    payload.path("error_description").asText("GitHub login failed")
            );
        }

        String accessToken = payload.path("access_token").asText("").trim();
        if (accessToken.isBlank()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "GitHub login did not return an access token");
        }

        return accessToken;
    }

    private JsonNode githubGet(String url, String accessToken) throws IOException, InterruptedException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(12))
                .header("Accept", "application/vnd.github+json")
                .header("Authorization", "Bearer " + accessToken)
                .header("User-Agent", "AI-Study-Hub")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 401 || response.statusCode() == 403) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "GitHub login token is invalid");
        }
        if (response.statusCode() != 200) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Could not read GitHub account details");
        }

        return objectMapper.readTree(response.body());
    }

    private GithubEmail fetchGithubEmail(String accessToken, String publicEmail)
            throws IOException, InterruptedException {
        JsonNode emails = githubGet("https://api.github.com/user/emails", accessToken);
        GithubEmail primaryVerified = null;
        GithubEmail firstVerified = null;

        if (emails.isArray()) {
            for (JsonNode item : emails) {
                String email = normalizeEmail(item.path("email").asText(""));
                boolean verified = item.path("verified").asBoolean(false);
                boolean primary = item.path("primary").asBoolean(false);
                if (email.isBlank() || !verified) {
                    continue;
                }
                GithubEmail candidate = new GithubEmail(email, true);
                if (primary) {
                    primaryVerified = candidate;
                    break;
                }
                if (firstVerified == null) {
                    firstVerified = candidate;
                }
            }
        }

        if (primaryVerified != null) {
            return primaryVerified;
        }
        if (firstVerified != null) {
            return firstVerified;
        }

        String fallbackEmail = normalizeEmail(publicEmail);
        if (!fallbackEmail.isBlank()) {
            return new GithubEmail(fallbackEmail, false);
        }

        throw new ApiException(HttpStatus.UNAUTHORIZED, "GitHub account does not include a verified email");
    }

    private String encodeFormValue(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
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
                    google_subject = ?,
                    email_verified = 1,
                    email_verified_at = COALESCE(email_verified_at, SYSDATETIME()),
                    updated_at = SYSDATETIME()
                WHERE user_id = ?
                """, profile.pictureUrl(), profile.googleSubject(), userId);
    }

    private void refreshGithubProfile(Long userId, GithubProfile profile) {
        jdbcTemplate.update("""
                UPDATE users
                SET avatar_url = CASE
                        WHEN (avatar_url IS NULL OR LTRIM(RTRIM(CAST(avatar_url AS NVARCHAR(MAX)))) = '') THEN ?
                        ELSE avatar_url
                    END,
                    updated_at = SYSDATETIME()
                WHERE user_id = ?
                """, profile.pictureUrl(), userId);
        markEmailVerifiedIfSupported(userId, profile.emailVerified());
    }

    private void markEmailVerifiedIfSupported(Long userId, boolean verified) {
        if (!verified
                || !columnExists("users", "email_verified")
                || !columnExists("users", "email_verified_at")) {
            return;
        }

        jdbcTemplate.update("""
                UPDATE users
                SET email_verified = 1,
                    email_verified_at = COALESCE(email_verified_at, SYSDATETIME()),
                    updated_at = SYSDATETIME()
                WHERE user_id = ?
                """, userId);
    }

    private AccountRecipient findAccountRecipient(Long userId) {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, email, password_hash
                FROM users
                WHERE user_id = ? AND status = 'ACTIVE'
                """, (rs, rowNum) -> new AccountRecipient(
                rs.getLong("user_id"),
                rs.getString("full_name"),
                rs.getString("email"),
                rs.getString("password_hash")
        ), userId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Active user not found"));
    }

    private String createAccountActionToken(Long userId, String actionType, String newEmail) {
        jdbcTemplate.update("""
                UPDATE account_action_tokens
                SET used = 1
                WHERE user_id = ? AND action_type = ? AND used = 0
                """, userId, actionType);

        String token = UUID.randomUUID().toString() + UUID.randomUUID();
        jdbcTemplate.update("""
                INSERT INTO account_action_tokens (user_id, action_type, token, new_email, used, expired_at)
                VALUES (?, ?, ?, ?, 0, DATEADD(MINUTE, 30, SYSDATETIME()))
                """, userId, actionType, token, newEmail);
        return token;
    }

    private AccountActionToken findValidAccountActionToken(String token) {
        return jdbcTemplate.query("""
                SELECT user_id, action_type, new_email
                FROM account_action_tokens
                WHERE token = ?
                  AND used = 0
                  AND expired_at > SYSDATETIME()
                """, (rs, rowNum) -> new AccountActionToken(
                rs.getLong("user_id"),
                rs.getString("action_type"),
                rs.getString("new_email")
        ), token).stream().findFirst().orElse(null);
    }

    private void markAccountActionTokenUsed(String token) {
        jdbcTemplate.update("""
                UPDATE account_action_tokens
                SET used = 1
                WHERE token = ?
                """, token);
    }

    private void deleteOwnAccount(Long userId) {
        String anonymizedEmail = "deleted-user-%d-%s@deleted.local".formatted(userId, UUID.randomUUID());
        jdbcTemplate.update("""
                UPDATE users
                SET full_name = ?,
                    email = ?,
                    password_hash = ?,
                    avatar_url = NULL,
                    phone = NULL,
                    university = NULL,
                    major = NULL,
                    google_subject = NULL,
                    email_verified = 0,
                    email_verified_at = NULL,
                    status = 'DELETED',
                    updated_at = SYSDATETIME()
                WHERE user_id = ?
                """,
                "Deleted User #" + userId,
                anonymizedEmail,
                UUID.randomUUID().toString() + UUID.randomUUID(),
                userId);

        jdbcTemplate.update("DELETE FROM notifications WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM password_reset_tokens WHERE user_id = ?", userId);
        jdbcTemplate.update("DELETE FROM user_settings WHERE user_id = ?", userId);
    }

    private boolean googleSubjectOwnedByDifferentUser(String googleSubject, Long userId) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM users
                WHERE google_subject = ? AND user_id <> ? AND status <> 'DELETED'
                """, Integer.class, googleSubject, userId);
        return count != null && count > 0;
    }

    private String normalizeEmail(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private void ensureAccountSecuritySchema() {
        boolean ready = tableExists("account_action_tokens")
                && columnExists("users", "email_verified")
                && columnExists("users", "email_verified_at")
                && columnExists("users", "google_subject");
        if (!ready) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Account security database schema is missing. Run database/add_account_security.sql.");
        }
    }

    private void ensureEmailVerificationTokenSchema() {
        if (!tableExists("email_verification_tokens")) {
            jdbcTemplate.execute("""
                    CREATE TABLE [dbo].[email_verification_tokens](
                        [token_id] [bigint] IDENTITY(1,1) NOT NULL,
                        [user_id] [bigint] NOT NULL,
                        [token] [varchar](255) NOT NULL,
                        [expires_at] [datetime2](7) NOT NULL,
                        [used] [bit] NOT NULL CONSTRAINT [DF_email_verification_tokens_used] DEFAULT ((0)),
                        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_email_verification_tokens_created_at] DEFAULT (sysdatetime()),
                        CONSTRAINT [PK_email_verification_tokens] PRIMARY KEY CLUSTERED ([token_id] ASC),
                        CONSTRAINT [UX_email_verification_tokens_token] UNIQUE NONCLUSTERED ([token] ASC),
                        CONSTRAINT [FK_email_verification_tokens_user] FOREIGN KEY([user_id])
                            REFERENCES [dbo].[users] ([user_id])
                    )
                    """);
        }

        if (!columnExists("email_verification_tokens", "expires_at")) {
            jdbcTemplate.execute("""
                    ALTER TABLE [dbo].[email_verification_tokens]
                    ADD [expires_at] [datetime2](7) NULL
                    """);

            if (columnExists("email_verification_tokens", "expired_at")) {
                jdbcTemplate.execute("""
                        UPDATE [dbo].[email_verification_tokens]
                        SET [expires_at] = [expired_at]
                        WHERE [expires_at] IS NULL
                        """);
            }

            jdbcTemplate.execute("""
                    UPDATE [dbo].[email_verification_tokens]
                    SET [expires_at] = DATEADD(MINUTE, 30, SYSDATETIME())
                    WHERE [expires_at] IS NULL
                    """);
            jdbcTemplate.execute("""
                    ALTER TABLE [dbo].[email_verification_tokens]
                    ALTER COLUMN [expires_at] [datetime2](7) NOT NULL
                    """);
        }

        if (columnExists("email_verification_tokens", "expired_at")
                && !defaultConstraintExists("email_verification_tokens", "expired_at")) {
            jdbcTemplate.execute("""
                    ALTER TABLE [dbo].[email_verification_tokens]
                    ADD CONSTRAINT [DF_email_verification_tokens_expired_at]
                    DEFAULT (DATEADD(MINUTE, 30, SYSDATETIME())) FOR [expired_at]
                    """);
        }

        if (!indexExists("email_verification_tokens", "IX_email_verification_tokens_user_expires")) {
            jdbcTemplate.execute("""
                    CREATE NONCLUSTERED INDEX [IX_email_verification_tokens_user_expires]
                    ON [dbo].[email_verification_tokens]([user_id], [used], [expires_at])
                    """);
        }
    }

    private boolean tableExists(String tableName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM sys.tables t
                INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
                WHERE s.name = 'dbo' AND t.name = ?
                """, Integer.class, tableName);
        return count != null && count > 0;
    }

    private boolean indexExists(String tableName, String indexName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM sys.indexes
                WHERE [object_id] = OBJECT_ID(?) AND [name] = ?
                """, Integer.class, "dbo." + tableName, indexName);
        return count != null && count > 0;
    }

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM sys.columns c
                WHERE c.object_id = OBJECT_ID(?) AND c.name = ?
                """, Integer.class, "dbo." + tableName, columnName);
        return count != null && count > 0;
    }

    private boolean defaultConstraintExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM sys.default_constraints dc
                INNER JOIN sys.columns c
                    ON c.object_id = dc.parent_object_id
                   AND c.column_id = dc.parent_column_id
                WHERE dc.parent_object_id = OBJECT_ID(?)
                  AND c.name = ?
                """, Integer.class, "dbo." + tableName, columnName);
        return count != null && count > 0;
    }

    private record GoogleProfile(
            String googleSubject,
            String email,
            String displayName,
            String pictureUrl
    ) {
    }

    private record GithubProfile(
            String email,
            String displayName,
            String pictureUrl,
            boolean emailVerified
    ) {
    }

    private record GithubEmail(
            String email,
            boolean verified
    ) {
    }

    private record AccountRecipient(
            Long userId,
            String fullName,
            String email,
            String passwordHash
    ) {
    }

    private record AccountActionToken(
            Long userId,
            String actionType,
            String newEmail
    ) {
    }
}
