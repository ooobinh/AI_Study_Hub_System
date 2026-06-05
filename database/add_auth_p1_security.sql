-- P1 Security features for AI Study Hub
-- Adds: email verification, login lockout, login logs, sessions (idle timeout), admin reauth, system settings.

-- 1) Users: email verification + lockout + password change timestamp + login failure counters
IF COL_LENGTH(N'dbo.users', N'email_verified') IS NULL
BEGIN
    ALTER TABLE [dbo].[users] ADD [email_verified] [bit] NOT NULL CONSTRAINT [DF_users_email_verified] DEFAULT (0);
END

IF COL_LENGTH(N'dbo.users', N'failed_login_count') IS NULL
BEGIN
    ALTER TABLE [dbo].[users] ADD [failed_login_count] [int] NOT NULL CONSTRAINT [DF_users_failed_login_count] DEFAULT (0);
END

IF COL_LENGTH(N'dbo.users', N'locked_until') IS NULL
BEGIN
    ALTER TABLE [dbo].[users] ADD [locked_until] [datetime2](7) NULL;
END

IF COL_LENGTH(N'dbo.users', N'password_changed_at') IS NULL
BEGIN
    ALTER TABLE [dbo].[users] ADD [password_changed_at] [datetime2](7) NULL;
END

IF COL_LENGTH(N'dbo.users', N'last_login_at') IS NULL
BEGIN
    ALTER TABLE [dbo].[users] ADD [last_login_at] [datetime2](7) NULL;
END

-- 2) Email verification tokens
IF OBJECT_ID(N'[dbo].[email_verification_tokens]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[email_verification_tokens] (
        [token_id] [bigint] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [user_id] [bigint] NOT NULL,
        [token] [varchar](200) NOT NULL,
        [expires_at] [datetime2](7) NOT NULL,
        [used] [bit] NOT NULL CONSTRAINT [DF_email_verification_tokens_used] DEFAULT (0),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_email_verification_tokens_created_at] DEFAULT (SYSDATETIME())
    );

    ALTER TABLE [dbo].[email_verification_tokens]
    ADD CONSTRAINT [fk_email_verification_tokens_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([user_id]) ON DELETE CASCADE;

    CREATE INDEX [ix_email_verification_tokens_token] ON [dbo].[email_verification_tokens] ([token]);
END

-- 3) Login attempt logs
IF OBJECT_ID(N'[dbo].[auth_login_logs]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[auth_login_logs] (
        [log_id] [bigint] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [email] [varchar](150) NULL,
        [user_id] [bigint] NULL,
        [success] [bit] NOT NULL,
        [ip_address] [varchar](64) NULL,
        [user_agent] [varchar](300) NULL,
        [message] [varchar](300) NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_auth_login_logs_created_at] DEFAULT (SYSDATETIME())
    );
    CREATE INDEX [ix_auth_login_logs_email] ON [dbo].[auth_login_logs] ([email]);
    CREATE INDEX [ix_auth_login_logs_user] ON [dbo].[auth_login_logs] ([user_id]);
END

-- 4) Sessions (idle timeout)
IF OBJECT_ID(N'[dbo].[user_sessions]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[user_sessions] (
        [session_id] [varchar](64) NOT NULL PRIMARY KEY,
        [user_id] [bigint] NOT NULL,
        [issued_at] [datetime2](7) NOT NULL,
        [last_activity_at] [datetime2](7) NOT NULL,
        [expires_at] [datetime2](7) NOT NULL,
        [revoked_at] [datetime2](7) NULL,
        [revoke_reason] [varchar](120) NULL,
        [ip_address] [varchar](64) NULL,
        [user_agent] [varchar](300) NULL
    );

    ALTER TABLE [dbo].[user_sessions]
    ADD CONSTRAINT [fk_user_sessions_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([user_id]) ON DELETE CASCADE;

    CREATE INDEX [ix_user_sessions_user] ON [dbo].[user_sessions] ([user_id]);
END

-- 5) Admin re-auth tokens
IF OBJECT_ID(N'[dbo].[admin_reauth_tokens]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[admin_reauth_tokens] (
        [token_id] [bigint] IDENTITY(1,1) NOT NULL PRIMARY KEY,
        [admin_id] [bigint] NOT NULL,
        [token] [varchar](200) NOT NULL,
        [expires_at] [datetime2](7) NOT NULL,
        [used] [bit] NOT NULL CONSTRAINT [DF_admin_reauth_tokens_used] DEFAULT (0),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_admin_reauth_tokens_created_at] DEFAULT (SYSDATETIME())
    );
    ALTER TABLE [dbo].[admin_reauth_tokens]
    ADD CONSTRAINT [fk_admin_reauth_tokens_admin]
    FOREIGN KEY([admin_id]) REFERENCES [dbo].[users] ([user_id]) ON DELETE CASCADE;

    CREATE INDEX [ix_admin_reauth_tokens_token] ON [dbo].[admin_reauth_tokens] ([token]);
END

-- 6) System settings (key/value)
IF OBJECT_ID(N'[dbo].[system_settings]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[system_settings] (
        [setting_key] [varchar](120) NOT NULL PRIMARY KEY,
        [setting_value] [varchar](500) NULL,
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_system_settings_updated_at] DEFAULT (SYSDATETIME())
    );
END

-- Default upload policy if missing
IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'upload.allowed_extensions')
    INSERT INTO system_settings(setting_key, setting_value) VALUES ('upload.allowed_extensions', 'pdf,docx,pptx');

IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'upload.max_bytes')
    INSERT INTO system_settings(setting_key, setting_value) VALUES ('upload.max_bytes', '10485760'); -- 10MB

IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'session.idle_minutes')
    INSERT INTO system_settings(setting_key, setting_value) VALUES ('session.idle_minutes', '60');

IF NOT EXISTS (SELECT 1 FROM system_settings WHERE setting_key = 'session.max_minutes')
    INSERT INTO system_settings(setting_key, setting_value) VALUES ('session.max_minutes', '720');

