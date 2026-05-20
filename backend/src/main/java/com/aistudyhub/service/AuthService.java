package com.aistudyhub.service;

import com.aistudyhub.common.ApiException;
import com.aistudyhub.dto.auth.AuthResponse;
import com.aistudyhub.dto.auth.LoginRequest;
import com.aistudyhub.dto.auth.RegisterRequest;
import com.aistudyhub.dto.auth.UserDto;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

@Service
public class AuthService {
    private final JdbcTemplate jdbcTemplate;
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
                    rs.getTimestamp("created_at").toLocalDateTime()
            );
        }
    };

    public AuthService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
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

    public AuthResponse login(LoginRequest request) {
        String hash = jdbcTemplate.query("""
                SELECT password_hash FROM users WHERE email = ? AND status = 'ACTIVE'
                """, rs -> rs.next() ? rs.getString("password_hash") : null, request.email());

        if (hash == null || !passwordEncoder.matches(request.password(), hash)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        UserDto user = findByEmail(request.email());
        return new AuthResponse(createDevelopmentToken(user.id()), user);
    }

    public UserDto findById(Long id) {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, email, avatar_url, university, major, status, created_at
                FROM users
                WHERE user_id = ?
                """, userMapper, id).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    public List<UserDto> listUsers() {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, email, avatar_url, university, major, status, created_at
                FROM users
                ORDER BY created_at DESC
                """, userMapper);
    }

    private UserDto findByEmail(String email) {
        return jdbcTemplate.query("""
                SELECT user_id, full_name, email, avatar_url, university, major, status, created_at
                FROM users
                WHERE email = ?
                """, userMapper, email).stream().findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private boolean emailExists(String email) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM users WHERE email = ?", Integer.class, email);
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

    private String createDevelopmentToken(Long userId) {
        return "dev-token-" + userId;
    }
}
