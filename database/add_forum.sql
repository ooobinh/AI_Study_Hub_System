IF OBJECT_ID(N'[dbo].[user_presence]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[user_presence](
        [user_id] [bigint] NOT NULL,
        [last_seen_at] [datetime2](7) NOT NULL CONSTRAINT [DF_user_presence_last_seen_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_user_presence] PRIMARY KEY CLUSTERED ([user_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[forum_posts]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[forum_posts](
        [post_id] [bigint] IDENTITY(1,1) NOT NULL,
        [author_id] [bigint] NOT NULL,
        [document_id] [bigint] NULL,
        [title] [nvarchar](255) NOT NULL,
        [content] [nvarchar](max) NULL,
        [post_type] [varchar](20) NOT NULL CONSTRAINT [DF_forum_posts_post_type] DEFAULT ('DISCUSSION'),
        [status] [varchar](20) NOT NULL CONSTRAINT [DF_forum_posts_status] DEFAULT ('ACTIVE'),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_forum_posts_created_at] DEFAULT (sysdatetime()),
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_forum_posts_updated_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_forum_posts] PRIMARY KEY CLUSTERED ([post_id] ASC),
        CONSTRAINT [chk_forum_posts_type] CHECK ([post_type] IN ('QUESTION', 'DISCUSSION', 'DOCUMENT')),
        CONSTRAINT [chk_forum_posts_status] CHECK ([status] IN ('ACTIVE', 'DELETED'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[forum_answers]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[forum_answers](
        [answer_id] [bigint] IDENTITY(1,1) NOT NULL,
        [post_id] [bigint] NOT NULL,
        [user_id] [bigint] NOT NULL,
        [content] [nvarchar](max) NOT NULL,
        [status] [varchar](20) NOT NULL CONSTRAINT [DF_forum_answers_status] DEFAULT ('ACTIVE'),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_forum_answers_created_at] DEFAULT (sysdatetime()),
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_forum_answers_updated_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_forum_answers] PRIMARY KEY CLUSTERED ([answer_id] ASC),
        CONSTRAINT [chk_forum_answers_status] CHECK ([status] IN ('ACTIVE', 'DELETED'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[fk_user_presence_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[user_presence] WITH CHECK ADD CONSTRAINT [fk_user_presence_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([user_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_forum_post_author]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[forum_posts] WITH CHECK ADD CONSTRAINT [fk_forum_post_author]
    FOREIGN KEY([author_id]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_forum_post_document]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[forum_posts] WITH CHECK ADD CONSTRAINT [fk_forum_post_document]
    FOREIGN KEY([document_id]) REFERENCES [dbo].[documents] ([document_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_forum_answer_post]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[forum_answers] WITH CHECK ADD CONSTRAINT [fk_forum_answer_post]
    FOREIGN KEY([post_id]) REFERENCES [dbo].[forum_posts] ([post_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_forum_answer_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[forum_answers] WITH CHECK ADD CONSTRAINT [fk_forum_answer_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_forum_posts_created' AND object_id = OBJECT_ID(N'[dbo].[forum_posts]'))
BEGIN
    CREATE INDEX [idx_forum_posts_created] ON [dbo].[forum_posts]([created_at] DESC)
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_forum_posts_type' AND object_id = OBJECT_ID(N'[dbo].[forum_posts]'))
BEGIN
    CREATE INDEX [idx_forum_posts_type] ON [dbo].[forum_posts]([post_type])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_forum_answers_post_created' AND object_id = OBJECT_ID(N'[dbo].[forum_answers]'))
BEGIN
    CREATE INDEX [idx_forum_answers_post_created] ON [dbo].[forum_answers]([post_id], [created_at])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_forum_answers_user_created' AND object_id = OBJECT_ID(N'[dbo].[forum_answers]'))
BEGIN
    CREATE INDEX [idx_forum_answers_user_created] ON [dbo].[forum_answers]([user_id], [created_at])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_user_presence_last_seen' AND object_id = OBJECT_ID(N'[dbo].[user_presence]'))
BEGIN
    CREATE INDEX [idx_user_presence_last_seen] ON [dbo].[user_presence]([last_seen_at] DESC)
END
GO
