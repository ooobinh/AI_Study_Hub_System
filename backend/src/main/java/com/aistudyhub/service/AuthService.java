package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.auth.AccountActionResultDto;
import com.aistudyhub.dto.auth.AccountSecurityDto;
import com.aistudyhub.dto.auth.AuthResponse;
import com.aistudyhub.dto.auth.ChangeEmailRequest;
import com.aistudyhub.dto.auth.ChangePasswordRequest;
import com.aistudyhub.dto.auth.ForgotPasswordRequest;
import com.aistudyhub.dto.auth.GoogleLoginRequest;
import com.aistudyhub.dto.auth.LinkGoogleAccountRequest;
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
            UserDto user = findById(existingUser.id());
            return new AuthResponse(createDevelopmentToken(user.id()), user);
        }

        jdbcTemplate.update("""
                INSERT INTO users (
                    full_name, email, password_hash, avatar_url, status,
                    google_subject, email_verified, email_verified_at
                )
                VALUES (?, ?, ?, ?, 'ACTIVE', ?, 1, SYSDATETIME())
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

    public AccountSecurityDto accountSecurity(Long userId) {
        ensureAccountSecuritySchema();
        return jdbcTemplate.query("""
                SELECT user_id, email, email_verified, email_verified_at, google_subject, created_at
                FROM users
                WHERE user_id = ? AND status <> 'DELETED'
                """, (rs, rowNum) -> new AccountSecurityDto(
                rs.getLong("user_id"),
                rs.getString("email"),
                rs.getBoolean("email_verified"),
                toLocalDateTime(rs.getTimestamp("email_verified_at")),
                rs.getString("google_subject") != null && !rs.getString("google_subject").isBlank(),
                toLocalDateTime(rs.getTimestamp("created_at"))
        ), userId).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @Transactional
    public MessageResponse sendEmailVerification(Long userId, String requestFrontendUrl) {
        ensureAccountSecuritySchema();
        AccountRecipient user = findAccountRecipient(userId);
        AccountSecurityDto status = accountSecurity(userId);
        if (status.emailVerified()) {
            return new MessageResponse("Your email is already verified.");
        }

        String token = createAccountActionToken(userId, "VERIFY_EMAIL", null);
        resendEmailService.sendEmailVerification(user.email(), user.fullName(), accountActionUrl(token, requestFrontendUrl));
        return new MessageResponse("Verification email sent.");
    }

    @Transactional
    public MessageResponse requestEmailChange(ChangeEmailRequest request, String requestFrontendUrl) {
        ensureAccountSecuritySchema();
        AccountRecipient user = findAccountRecipient(request.userId());
        String newEmail = normalizeEmail(request.newEmail());
        if (newEmail.equalsIgnoreCase(user.email())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "New email must be different from your current email");
        }
        if (emailExistsForDifferentUser(newEmail, request.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
        }

        String token = createAccountActionToken(request.userId(), "CHANGE_EMAIL", newEmail);
        resendEmailService.sendEmailChangeConfirmation(newEmail, user.fullName(), accountActionUrl(token, requestFrontendUrl));
        return new MessageResponse("Confirmation email sent to " + newEmail + ".");
    }

    @Transactional
    public MessageResponse requestAccountDeletion(Long userId, String requestFrontendUrl) {
        ensureAccountSecuritySchema();
        AccountRecipient user = findAccountRecipient(userId);
        String token = createAccountActionToken(userId, "DELETE_ACCOUNT", null);
        resendEmailService.sendAccountDeletionConfirmation(user.email(), user.fullName(), accountActionUrl(token, requestFrontendUrl));
        return new MessageResponse("Account deletion confirmation email sent.");
    }

    @Transactional
    public MessageResponse changePassword(ChangePasswordRequest request) {
        AccountRecipient user = findAccountRecipient(request.userId());
        if (!passwordMatches(user.email(), request.currentPassword(), user.passwordHash())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        jdbcTemplate.update("""
                UPDATE users
                SET password_hash = ?, updated_at = SYSDATETIME()
                WHERE user_id = ? AND status = 'ACTIVE'
                """, passwordEncoder.encode(request.newPassword()), request.userId());
        return new MessageResponse("Password updated successfully.");
    }

    @Transactional
    public AccountSecurityDto linkGoogleAccount(LinkGoogleAccountRequest request) {
        ensureAccountSecuritySchema();
        GoogleProfile profile = verifyGoogleCredential(request.credential());
        AccountRecipient user = findAccountRecipient(request.userId());
        if (!profile.email().equalsIgnoreCase(user.email())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Use the Google account with the same email as your AI Study Hub account");
        }
        if (googleSubjectOwnedByDifferentUser(profile.googleSubject(), request.userId())) {
            throw new ApiException(HttpStatus.CONFLICT, "This Google account is already linked to another account");
        }

        refreshGoogleProfile(request.userId(), profile);
        return accountSecurity(request.userId());
    }

    @Transactional
    public AccountActionResultDto confirmAccountAction(String token) {
        ensureAccountSecuritySchema();
        AccountActionToken actionToken = findValidAccountActionToken(token);
        if (actionToken == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Confirmation link is invalid or expired");
        }

        if ("VERIFY_EMAIL".equals(actionToken.actionType())) {
            jdbcTemplate.update("""
                    UPDATE users
                    SET email_verified = 1, email_verified_at = SYSDATETIME(), updated_at = SYSDATETIME()
                    WHERE user_id = ? AND status = 'ACTIVE'
                    """, actionToken.userId());
            markAccountActionTokenUsed(token);
            return new AccountActionResultDto(actionToken.actionType(), "Email verified successfully.");
        }

        if ("CHANGE_EMAIL".equals(actionToken.actionType())) {
            if (emailExistsForDifferentUser(actionToken.newEmail(), actionToken.userId())) {
                throw new ApiException(HttpStatus.CONFLICT, "Email already exists");
            }
            jdbcTemplate.update("""
                    UPDATE users
                    SET email = ?, email_verified = 1, email_verified_at = SYSDATETIME(), updated_at = SYSDATETIME()
                    WHERE user_id = ? AND status = 'ACTIVE'
                    """, actionToken.newEmail(), actionToken.userId());
            markAccountActionTokenUsed(token);
            return new AccountActionResultDto(actionToken.actionType(), "Email changed and verified successfully.");
        }

        if ("DELETE_ACCOUNT".equals(actionToken.actionType())) {
            markAccountActionTokenUsed(token);
            deleteOwnAccount(actionToken.userId());
            return new AccountActionResultDto(actionToken.actionType(), "Your account has been deleted.");
        }

        throw new ApiException(HttpStatus.BAD_REQUEST, "Unsupported account action");
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

    private void ensureAccountSecuritySchema() {
        boolean ready = tableExists("account_action_tokens")
                && columnExists("users", "email_verified")
                && columnExists("users", "email_verified_at")
                && columnExists("users", "google_subject");
        if (!ready) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "Account security database schema is missing. Run database/add_account_security.sql.");
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

    private boolean columnExists(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM sys.columns c
                WHERE c.object_id = OBJECT_ID(?) AND c.name = ?
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
