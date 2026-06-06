SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.email_verification_tokens', N'U') IS NULL
BEGIN
    EXEC(N'
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
    ');
END;

IF OBJECT_ID(N'dbo.email_verification_tokens', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.email_verification_tokens', N'expires_at') IS NULL
BEGIN
    EXEC(N'
        ALTER TABLE [dbo].[email_verification_tokens]
        ADD [expires_at] [datetime2](7) NULL
    ');
END;

IF OBJECT_ID(N'dbo.email_verification_tokens', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.email_verification_tokens', N'expires_at') IS NOT NULL
   AND COL_LENGTH(N'dbo.email_verification_tokens', N'expired_at') IS NOT NULL
BEGIN
    EXEC(N'
        UPDATE [dbo].[email_verification_tokens]
        SET [expires_at] = [expired_at]
        WHERE [expires_at] IS NULL
    ');
END;

IF OBJECT_ID(N'dbo.email_verification_tokens', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.email_verification_tokens', N'expires_at') IS NOT NULL
BEGIN
    EXEC(N'
        UPDATE [dbo].[email_verification_tokens]
        SET [expires_at] = DATEADD(MINUTE, 30, SYSDATETIME())
        WHERE [expires_at] IS NULL
    ');
END;

IF OBJECT_ID(N'dbo.email_verification_tokens', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.email_verification_tokens', N'expires_at') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.columns
        WHERE [object_id] = OBJECT_ID(N'dbo.email_verification_tokens')
          AND [name] = N'expires_at'
          AND [is_nullable] = 1
   )
BEGIN
    EXEC(N'
        ALTER TABLE [dbo].[email_verification_tokens]
        ALTER COLUMN [expires_at] [datetime2](7) NOT NULL
    ');
END;

IF OBJECT_ID(N'dbo.email_verification_tokens', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.email_verification_tokens', N'expired_at') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c
            ON c.object_id = dc.parent_object_id
           AND c.column_id = dc.parent_column_id
        WHERE dc.parent_object_id = OBJECT_ID(N'dbo.email_verification_tokens')
          AND c.name = N'expired_at'
   )
BEGIN
    EXEC(N'
        ALTER TABLE [dbo].[email_verification_tokens]
        ADD CONSTRAINT [DF_email_verification_tokens_expired_at]
        DEFAULT (DATEADD(MINUTE, 30, SYSDATETIME())) FOR [expired_at]
    ');
END;

IF OBJECT_ID(N'dbo.email_verification_tokens', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.email_verification_tokens', N'expires_at') IS NOT NULL
   AND NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE [name] = N'IX_email_verification_tokens_user_expires'
          AND [object_id] = OBJECT_ID(N'dbo.email_verification_tokens')
   )
BEGIN
    EXEC(N'
        CREATE NONCLUSTERED INDEX [IX_email_verification_tokens_user_expires]
        ON [dbo].[email_verification_tokens]([user_id], [used], [expires_at])
    ');
END;
