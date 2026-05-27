IF OBJECT_ID(N'[dbo].[workspace_messages]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_messages](
        [message_id] [bigint] IDENTITY(1,1) NOT NULL,
        [workspace_id] [bigint] NOT NULL,
        [user_id] [bigint] NOT NULL,
        [content] [nvarchar](max) NOT NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_messages_created_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_messages] PRIMARY KEY CLUSTERED ([message_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_documents]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_documents](
        [workspace_id] [bigint] NOT NULL,
        [document_id] [bigint] NOT NULL,
        [added_by] [bigint] NOT NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_documents_created_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_documents] PRIMARY KEY CLUSTERED ([workspace_id] ASC, [document_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_members]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_members](
        [workspace_id] [bigint] NOT NULL,
        [user_id] [bigint] NOT NULL,
        [role] [varchar](20) NOT NULL CONSTRAINT [DF_workspace_members_role] DEFAULT ('MEMBER'),
        [joined_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_members_joined_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_members] PRIMARY KEY CLUSTERED ([workspace_id] ASC, [user_id] ASC),
        CONSTRAINT [chk_workspace_members_role] CHECK ([role] IN ('OWNER', 'MEMBER'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspaces]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspaces](
        [workspace_id] [bigint] IDENTITY(1,1) NOT NULL,
        [name] [nvarchar](150) NOT NULL,
        [description] [nvarchar](max) NULL,
        [invite_code] [varchar](20) NOT NULL,
        [owner_id] [bigint] NOT NULL,
        [status] [varchar](20) NOT NULL CONSTRAINT [DF_workspaces_status] DEFAULT ('ACTIVE'),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspaces_created_at] DEFAULT (sysdatetime()),
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspaces_updated_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspaces] PRIMARY KEY CLUSTERED ([workspace_id] ASC),
        CONSTRAINT [UQ_workspaces_invite_code] UNIQUE ([invite_code]),
        CONSTRAINT [chk_workspaces_status] CHECK ([status] IN ('ACTIVE', 'ARCHIVED'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_owner]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspaces] WITH CHECK ADD CONSTRAINT [fk_workspace_owner]
    FOREIGN KEY([owner_id]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_member_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_members] WITH CHECK ADD CONSTRAINT [fk_workspace_member_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_member_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_members] WITH CHECK ADD CONSTRAINT [fk_workspace_member_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([user_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_document_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_documents] WITH CHECK ADD CONSTRAINT [fk_workspace_document_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_document_document]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_documents] WITH CHECK ADD CONSTRAINT [fk_workspace_document_document]
    FOREIGN KEY([document_id]) REFERENCES [dbo].[documents] ([document_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_document_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_documents] WITH CHECK ADD CONSTRAINT [fk_workspace_document_user]
    FOREIGN KEY([added_by]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_message_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_messages] WITH CHECK ADD CONSTRAINT [fk_workspace_message_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_message_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_messages] WITH CHECK ADD CONSTRAINT [fk_workspace_message_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_workspace_members_user' AND object_id = OBJECT_ID(N'[dbo].[workspace_members]'))
BEGIN
    CREATE INDEX [idx_workspace_members_user] ON [dbo].[workspace_members]([user_id])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_workspace_documents_document' AND object_id = OBJECT_ID(N'[dbo].[workspace_documents]'))
BEGIN
    CREATE INDEX [idx_workspace_documents_document] ON [dbo].[workspace_documents]([document_id])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_workspace_messages_workspace_created' AND object_id = OBJECT_ID(N'[dbo].[workspace_messages]'))
BEGIN
    CREATE INDEX [idx_workspace_messages_workspace_created] ON [dbo].[workspace_messages]([workspace_id], [created_at])
END
GO



