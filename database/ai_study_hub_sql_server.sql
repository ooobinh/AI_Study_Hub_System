-- AI Study Hub - SQL Server schema
-- Development setup script. Do not run DROP DATABASE in production.

IF DB_ID('AI_Study_Hub') IS NOT NULL
BEGIN
    ALTER DATABASE AI_Study_Hub SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE AI_Study_Hub;
END
GO

CREATE DATABASE AI_Study_Hub;
GO

USE AI_Study_Hub;
GO

CREATE TABLE roles (
    role_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description NVARCHAR(255)
);
GO

CREATE TABLE users (
    user_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    full_name NVARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url NVARCHAR(MAX),
    phone VARCHAR(20),
    university NVARCHAR(150),
    major NVARCHAR(150),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'BANNED'))
);
GO

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role_id BIGINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE CASCADE
);
GO

CREATE TABLE password_reset_tokens (
    token_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expired_at DATETIME2 NOT NULL,
    used BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
GO

CREATE TABLE user_settings (
    user_id BIGINT PRIMARY KEY,
    theme VARCHAR(20) NOT NULL DEFAULT 'system',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    email_notifications BIT NOT NULL DEFAULT 1,
    push_notifications BIT NOT NULL DEFAULT 1,
    study_reminders BIT NOT NULL DEFAULT 1,
    weekly_summary BIT NOT NULL DEFAULT 1,
    updated_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT chk_user_settings_theme CHECK (theme IN ('light', 'dark', 'system')),
    CONSTRAINT chk_user_settings_language CHECK (language IN ('en', 'vi')),
    CONSTRAINT fk_user_settings_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
GO

CREATE TABLE subjects (
    subject_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    subject_code VARCHAR(50) NOT NULL UNIQUE,
    subject_name NVARCHAR(150) NOT NULL,
    description NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT SYSDATETIME()
);
GO

CREATE TABLE categories (
    category_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    category_name NVARCHAR(100) NOT NULL UNIQUE,
    description NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT SYSDATETIME()
);
GO

CREATE TABLE documents (
    document_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    subject_id BIGINT NULL,
    category_id BIGINT NULL,
    title NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    original_file_name NVARCHAR(255) NOT NULL,
    file_url NVARCHAR(MAX) NOT NULL,
    preview_url NVARCHAR(MAX),
    file_type VARCHAR(50),
    file_size BIGINT,
    page_count INT,
    visibility VARCHAR(20) NOT NULL DEFAULT 'PRIVATE',
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    download_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT chk_documents_visibility CHECK (visibility IN ('PRIVATE', 'PUBLIC', 'SHARED')),
    CONSTRAINT chk_documents_status CHECK (status IN ('ACTIVE', 'DELETED', 'PENDING_REVIEW', 'REJECTED')),
    CONSTRAINT fk_document_owner FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE NO ACTION,
    CONSTRAINT fk_document_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE NO ACTION,
    CONSTRAINT fk_document_category FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE NO ACTION
);
GO

CREATE TABLE document_tags (
    tag_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    tag_name NVARCHAR(100) NOT NULL UNIQUE
);
GO

CREATE TABLE document_tag_mapping (
    document_id BIGINT NOT NULL,
    tag_id BIGINT NOT NULL,
    PRIMARY KEY (document_id, tag_id),
    CONSTRAINT fk_doc_tag_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    CONSTRAINT fk_doc_tag_tag FOREIGN KEY (tag_id) REFERENCES document_tags(tag_id) ON DELETE CASCADE
);
GO

CREATE TABLE document_favorites (
    user_id BIGINT NOT NULL,
    document_id BIGINT NOT NULL,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    PRIMARY KEY (user_id, document_id),
    CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE NO ACTION
);
GO

CREATE TABLE document_shares (
    share_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    document_id BIGINT NOT NULL,
    shared_by BIGINT NOT NULL,
    shared_with BIGINT NULL,
    share_token VARCHAR(255) UNIQUE,
    permission VARCHAR(20) NOT NULL DEFAULT 'VIEW',
    expired_at DATETIME2,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT chk_share_permission CHECK (permission IN ('VIEW', 'DOWNLOAD', 'EDIT')),
    CONSTRAINT fk_share_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    CONSTRAINT fk_share_by FOREIGN KEY (shared_by) REFERENCES users(user_id) ON DELETE NO ACTION,
    CONSTRAINT fk_share_with FOREIGN KEY (shared_with) REFERENCES users(user_id) ON DELETE NO ACTION
);
GO

CREATE TABLE document_contents (
    content_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    document_id BIGINT NOT NULL UNIQUE,
    extracted_text NVARCHAR(MAX),
    extraction_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    extracted_at DATETIME2,
    CONSTRAINT chk_extraction_status CHECK (extraction_status IN ('PENDING', 'SUCCESS', 'FAILED')),
    CONSTRAINT fk_content_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
);
GO

CREATE TABLE document_chunks (
    chunk_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    document_id BIGINT NOT NULL,
    chunk_index INT NOT NULL,
    chunk_text NVARCHAR(MAX) NOT NULL,
    embedding_vector NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT uq_document_chunk UNIQUE (document_id, chunk_index),
    CONSTRAINT fk_chunk_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
);
GO

CREATE TABLE upload_logs (
    upload_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    document_id BIGINT NULL,
    file_name NVARCHAR(255) NOT NULL,
    storage_provider VARCHAR(20) NOT NULL DEFAULT 'FIREBASE',
    upload_status VARCHAR(20) NOT NULL DEFAULT 'UPLOADING',
    error_message NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT chk_storage_provider CHECK (storage_provider IN ('FIREBASE', 'LOCAL', 'S3')),
    CONSTRAINT chk_upload_status CHECK (upload_status IN ('UPLOADING', 'SUCCESS', 'FAILED')),
    CONSTRAINT fk_upload_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION,
    CONSTRAINT fk_upload_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE NO ACTION
);
GO

CREATE TABLE chat_sessions (
    session_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    document_id BIGINT NULL,
    session_title NVARCHAR(255),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE NO ACTION
);
GO

CREATE TABLE chat_messages (
    message_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    session_id BIGINT NOT NULL,
    sender VARCHAR(10) NOT NULL,
    message_text NVARCHAR(MAX) NOT NULL,
    ai_model VARCHAR(100),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT chk_message_sender CHECK (sender IN ('USER', 'AI')),
    CONSTRAINT fk_message_session FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id) ON DELETE CASCADE
);
GO

CREATE TABLE ai_summaries (
    summary_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    document_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    summary_text NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT fk_summary_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    CONSTRAINT fk_summary_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION
);
GO

CREATE TABLE ai_quizzes (
    quiz_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    document_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    quiz_title NVARCHAR(255),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT fk_quiz_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    CONSTRAINT fk_quiz_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION
);
GO

CREATE TABLE quiz_questions (
    question_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    question_text NVARCHAR(MAX) NOT NULL,
    option_a NVARCHAR(MAX),
    option_b NVARCHAR(MAX),
    option_c NVARCHAR(MAX),
    option_d NVARCHAR(MAX),
    correct_answer VARCHAR(1),
    explanation NVARCHAR(MAX),
    CONSTRAINT chk_correct_answer CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
    CONSTRAINT fk_question_quiz FOREIGN KEY (quiz_id) REFERENCES ai_quizzes(quiz_id) ON DELETE CASCADE
);
GO

CREATE TABLE quiz_attempts (
    attempt_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    quiz_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    score DECIMAL(5,2),
    total_questions INT,
    correct_count INT,
    completed_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT fk_attempt_quiz FOREIGN KEY (quiz_id) REFERENCES ai_quizzes(quiz_id) ON DELETE CASCADE,
    CONSTRAINT fk_attempt_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION
);
GO

CREATE TABLE ai_flashcards (
    flashcard_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    document_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    front_text NVARCHAR(MAX) NOT NULL,
    back_text NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT fk_flashcard_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    CONSTRAINT fk_flashcard_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION
);
GO

CREATE TABLE flashcard_reviews (
    review_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    flashcard_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating INT NOT NULL,
    reviewed_at DATETIME2 DEFAULT SYSDATETIME(),
    next_review_at DATETIME2,
    CONSTRAINT chk_flashcard_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_review_flashcard FOREIGN KEY (flashcard_id) REFERENCES ai_flashcards(flashcard_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION
);
GO

CREATE TABLE comments (
    comment_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    document_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    updated_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT fk_comment_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION
);
GO

CREATE TABLE reports (
    report_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    document_id BIGINT NULL,
    reported_by BIGINT NOT NULL,
    reason NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT chk_report_status CHECK (status IN ('PENDING', 'RESOLVED', 'REJECTED')),
    CONSTRAINT fk_report_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE NO ACTION,
    CONSTRAINT fk_report_user FOREIGN KEY (reported_by) REFERENCES users(user_id) ON DELETE NO ACTION
);
GO

CREATE TABLE notifications (
    notification_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title NVARCHAR(255) NOT NULL,
    content NVARCHAR(MAX),
    is_read BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
GO

CREATE TABLE activity_logs (
    log_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100),
    target_id BIGINT,
    ip_address VARCHAR(100),
    created_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT fk_activity_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION
);
GO

CREATE TABLE study_sessions (
    study_session_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    user_id BIGINT NOT NULL,
    subject_id BIGINT NULL,
    started_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    ended_at DATETIME2,
    duration_minutes INT,
    notes NVARCHAR(MAX),
    CONSTRAINT fk_study_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_study_subject FOREIGN KEY (subject_id) REFERENCES subjects(subject_id) ON DELETE NO ACTION
);
GO

CREATE TABLE document_views (
    view_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    document_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    viewed_at DATETIME2 DEFAULT SYSDATETIME(),
    CONSTRAINT fk_view_document FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE,
    CONSTRAINT fk_view_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE NO ACTION
);
GO

CREATE TABLE achievements (
    achievement_id BIGINT IDENTITY(1,1) PRIMARY KEY,
    code VARCHAR(80) NOT NULL UNIQUE,
    title NVARCHAR(120) NOT NULL,
    description NVARCHAR(255),
    icon VARCHAR(80),
    created_at DATETIME2 DEFAULT SYSDATETIME()
);
GO

CREATE TABLE user_achievements (
    user_id BIGINT NOT NULL,
    achievement_id BIGINT NOT NULL,
    earned_at DATETIME2 DEFAULT SYSDATETIME(),
    PRIMARY KEY (user_id, achievement_id),
    CONSTRAINT fk_user_achievement_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_achievement FOREIGN KEY (achievement_id) REFERENCES achievements(achievement_id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_documents_title ON documents(title);
CREATE INDEX idx_documents_owner ON documents(owner_id);
CREATE INDEX idx_documents_subject ON documents(subject_id);
CREATE INDEX idx_documents_visibility ON documents(visibility);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_document_chunks_document ON document_chunks(document_id);
GO

INSERT INTO roles (role_name, description) VALUES
('GUEST', N'Guest user with limited access'),
('USER', N'Normal student user'),
('ADMIN', N'System administrator');
GO

INSERT INTO users (full_name, email, password_hash, university, major, status) VALUES
(N'Nguyen Trong Binh', 'binh@example.com', '$2a$10$00PbLTGtsq.n2XP/m/ksyezr66pJplh4ATjVDYM5O51QXMy8bPfeS', N'FPT University', N'Software Engineering', 'ACTIVE'),
(N'Admin User', 'admin@example.com', '$2a$10$.yOBCrr.X8SUicyOdvYvOu15yKu/BHYFlQMXRZgDViDxuprxCYZxa', N'FPT University', N'Software Engineering', 'ACTIVE');
GO

INSERT INTO user_roles (user_id, role_id) VALUES (1, 2), (2, 3);
INSERT INTO user_settings (user_id, theme, language) VALUES (1, 'system', 'en'), (2, 'dark', 'en');
GO

INSERT INTO subjects (subject_code, subject_name, description) VALUES
('PRJ301', N'Java Web Application Development', N'Java Servlet, JSP, MVC, JDBC'),
('SWT301', N'Software Testing', N'Testing process, validation, verification'),
('CSD201', N'Data Structures and Algorithms', N'Linked List, Stack, Queue, Tree'),
('DBI202', N'Database Systems', N'SQL, ERD, relational database');
GO

INSERT INTO categories (category_name, description) VALUES
(N'Lecture Slide', N'Lecture slide documents'),
(N'Assignment', N'Assignment documents'),
(N'Exam Review', N'Exam preparation materials'),
(N'Book', N'Textbooks and reference books'),
(N'Note', N'Student notes');
GO

INSERT INTO document_tags (tag_name) VALUES
(N'Java'), (N'Spring Boot'), (N'SQL Server'), (N'AI'), (N'Testing'), (N'Database');
GO

INSERT INTO achievements (code, title, description, icon) VALUES
('EARLY_ADOPTER', N'Early Adopter', N'Joined the platform early', 'Zap'),
('KNOWLEDGE_SEEKER', N'Knowledge Seeker', N'Uploaded study documents', 'BookOpen'),
('AI_EXPLORER', N'AI Explorer', N'Used AI study assistant', 'MessageSquare');
GO

INSERT INTO user_achievements (user_id, achievement_id) VALUES (1, 1), (1, 2), (1, 3);
GO
