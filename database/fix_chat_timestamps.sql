IF OBJECT_ID(N'[dbo].[chat_sessions]', N'U') IS NOT NULL
BEGIN
    UPDATE [dbo].[chat_sessions]
    SET [created_at] = COALESCE([created_at], SYSDATETIME()),
        [updated_at] = COALESCE([updated_at], SYSDATETIME())
    WHERE [created_at] IS NULL OR [updated_at] IS NULL
END
GO

IF OBJECT_ID(N'[dbo].[chat_messages]', N'U') IS NOT NULL
BEGIN
    UPDATE [dbo].[chat_messages]
    SET [created_at] = COALESCE([created_at], SYSDATETIME())
    WHERE [created_at] IS NULL
END
GO

IF OBJECT_ID(N'[dbo].[DF_chat_sessions_created_at]', N'D') IS NULL
BEGIN
    ALTER TABLE [dbo].[chat_sessions] ADD CONSTRAINT [DF_chat_sessions_created_at]
    DEFAULT (SYSDATETIME()) FOR [created_at]
END
GO

IF OBJECT_ID(N'[dbo].[DF_chat_sessions_updated_at]', N'D') IS NULL
BEGIN
    ALTER TABLE [dbo].[chat_sessions] ADD CONSTRAINT [DF_chat_sessions_updated_at]
    DEFAULT (SYSDATETIME()) FOR [updated_at]
END
GO

IF OBJECT_ID(N'[dbo].[DF_chat_messages_created_at]', N'D') IS NULL
BEGIN
    ALTER TABLE [dbo].[chat_messages] ADD CONSTRAINT [DF_chat_messages_created_at]
    DEFAULT (SYSDATETIME()) FOR [created_at]
END
GO
