SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.users', N'email_verified') IS NULL
BEGIN
    ALTER TABLE [dbo].[users]
    ADD [email_verified] [bit] NOT NULL
        CONSTRAINT [DF_users_email_verified] DEFAULT ((0));
END
GO

IF COL_LENGTH(N'dbo.users', N'email_verified_at') IS NULL
BEGIN
    ALTER TABLE [dbo].[users]
    ADD [email_verified_at] [datetime2](7) NULL;
END
GO

IF COL_LENGTH(N'dbo.users', N'google_subject') IS NULL
BEGIN
    ALTER TABLE [dbo].[users]
    ADD [google_subject] [nvarchar](255) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE [name] = N'UX_users_google_subject'
      AND [object_id] = OBJECT_ID(N'dbo.users')
)
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX [UX_users_google_subject]
    ON [dbo].[users]([google_subject])
    WHERE [google_subject] IS NOT NULL;
END
GO

IF OBJECT_ID(N'dbo.account_action_tokens', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[account_action_tokens](
        [token_id] [bigint] IDENTITY(1,1) NOT NULL,
        [user_id] [bigint] NOT NULL,
        [action_type] [varchar](30) NOT NULL,
        [token] [varchar](255) NOT NULL,
        [new_email] [nvarchar](150) NULL,
        [used] [bit] NOT NULL CONSTRAINT [DF_account_action_tokens_used] DEFAULT ((0)),
        [expired_at] [datetime2](7) NOT NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_account_action_tokens_created_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_account_action_tokens] PRIMARY KEY CLUSTERED ([token_id] ASC),
        CONSTRAINT [UX_account_action_tokens_token] UNIQUE NONCLUSTERED ([token] ASC),
        CONSTRAINT [FK_account_action_tokens_user] FOREIGN KEY([user_id])
            REFERENCES [dbo].[users] ([user_id]),
        CONSTRAINT [CHK_account_action_tokens_action_type] CHECK (
            [action_type] IN ('VERIFY_EMAIL', 'CHANGE_EMAIL', 'DELETE_ACCOUNT')
        )
    );
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE [name] = N'IX_account_action_tokens_user_action'
      AND [object_id] = OBJECT_ID(N'dbo.account_action_tokens')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_account_action_tokens_user_action]
    ON [dbo].[account_action_tokens]([user_id], [action_type], [used], [expired_at]);
END
GO
