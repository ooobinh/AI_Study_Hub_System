IF COL_LENGTH(N'dbo.workspaces', N'subject_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspaces] ADD [subject_id] [bigint] NULL
END
GO

IF COL_LENGTH(N'dbo.workspaces', N'visibility') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspaces] ADD [visibility] [varchar](20) NOT NULL
        CONSTRAINT [DF_workspaces_visibility] DEFAULT ('PRIVATE')
END
GO

IF OBJECT_ID(N'[dbo].[chk_workspaces_visibility]', N'C') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspaces] WITH CHECK ADD CONSTRAINT [chk_workspaces_visibility]
    CHECK ([visibility] IN ('PRIVATE', 'PUBLIC'))
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_subject]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspaces] WITH CHECK ADD CONSTRAINT [fk_workspace_subject]
    FOREIGN KEY([subject_id]) REFERENCES [dbo].[subjects] ([subject_id])
END
GO

IF OBJECT_ID(N'[dbo].[chk_workspace_members_role]', N'C') IS NOT NULL
BEGIN
    ALTER TABLE [dbo].[workspace_members] DROP CONSTRAINT [chk_workspace_members_role]
END
GO

IF OBJECT_ID(N'[dbo].[chk_workspace_members_role]', N'C') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_members] WITH CHECK ADD CONSTRAINT [chk_workspace_members_role]
    CHECK ([role] IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER'))
END
GO

IF OBJECT_ID(N'[dbo].[workspace_invitations]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_invitations](
        [invitation_id] [bigint] IDENTITY(1,1) NOT NULL,
        [workspace_id] [bigint] NOT NULL,
        [invited_email] [nvarchar](255) NULL,
        [invite_token] [varchar](80) NOT NULL,
        [role] [varchar](20) NOT NULL CONSTRAINT [DF_workspace_invitations_role] DEFAULT ('MEMBER'),
        [invited_by] [bigint] NOT NULL,
        [accepted_by] [bigint] NULL,
        [accepted_at] [datetime2](7) NULL,
        [expires_at] [datetime2](7) NULL,
        [status] [varchar](20) NOT NULL CONSTRAINT [DF_workspace_invitations_status] DEFAULT ('PENDING'),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_invitations_created_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_invitations] PRIMARY KEY CLUSTERED ([invitation_id] ASC),
        CONSTRAINT [UQ_workspace_invitations_token] UNIQUE ([invite_token]),
        CONSTRAINT [chk_workspace_invitations_role] CHECK ([role] IN ('ADMIN', 'MEMBER', 'VIEWER')),
        CONSTRAINT [chk_workspace_invitations_status] CHECK ([status] IN ('PENDING', 'ACCEPTED', 'CANCELLED', 'EXPIRED'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_tasks]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_tasks](
        [task_id] [bigint] IDENTITY(1,1) NOT NULL,
        [workspace_id] [bigint] NOT NULL,
        [title] [nvarchar](180) NOT NULL,
        [description] [nvarchar](max) NULL,
        [assigned_to] [bigint] NULL,
        [created_by] [bigint] NOT NULL,
        [status] [varchar](20) NOT NULL CONSTRAINT [DF_workspace_tasks_status] DEFAULT ('TODO'),
        [deadline_at] [datetime2](7) NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_tasks_created_at] DEFAULT (sysdatetime()),
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_tasks_updated_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_tasks] PRIMARY KEY CLUSTERED ([task_id] ASC),
        CONSTRAINT [chk_workspace_tasks_status] CHECK ([status] IN ('TODO', 'IN_PROGRESS', 'DONE'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_posts]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_posts](
        [post_id] [bigint] IDENTITY(1,1) NOT NULL,
        [workspace_id] [bigint] NOT NULL,
        [author_id] [bigint] NOT NULL,
        [title] [nvarchar](180) NOT NULL,
        [content] [nvarchar](max) NOT NULL,
        [pinned] [bit] NOT NULL CONSTRAINT [DF_workspace_posts_pinned] DEFAULT (0),
        [attached_document_id] [bigint] NULL,
        [status] [varchar](20) NOT NULL CONSTRAINT [DF_workspace_posts_status] DEFAULT ('ACTIVE'),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_posts_created_at] DEFAULT (sysdatetime()),
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_posts_updated_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_posts] PRIMARY KEY CLUSTERED ([post_id] ASC),
        CONSTRAINT [chk_workspace_posts_status] CHECK ([status] IN ('ACTIVE', 'DELETED'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_post_comments]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_post_comments](
        [comment_id] [bigint] IDENTITY(1,1) NOT NULL,
        [post_id] [bigint] NOT NULL,
        [user_id] [bigint] NOT NULL,
        [content] [nvarchar](max) NOT NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_post_comments_created_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_post_comments] PRIMARY KEY CLUSTERED ([comment_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_ai_outputs]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_ai_outputs](
        [output_id] [bigint] IDENTITY(1,1) NOT NULL,
        [workspace_id] [bigint] NOT NULL,
        [document_id] [bigint] NULL,
        [requested_by] [bigint] NOT NULL,
        [output_type] [varchar](30) NOT NULL,
        [prompt] [nvarchar](max) NULL,
        [result_text] [nvarchar](max) NOT NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_ai_outputs_created_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_ai_outputs] PRIMARY KEY CLUSTERED ([output_id] ASC),
        CONSTRAINT [chk_workspace_ai_outputs_type] CHECK ([output_type] IN ('CHAT', 'SUMMARY', 'QUIZ', 'FLASHCARD', 'REVIEW_QUESTIONS'))
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_quizzes]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_quizzes](
        [quiz_id] [bigint] IDENTITY(1,1) NOT NULL,
        [workspace_id] [bigint] NOT NULL,
        [document_id] [bigint] NULL,
        [title] [nvarchar](180) NOT NULL,
        [created_by] [bigint] NOT NULL,
        [questions_json] [nvarchar](max) NOT NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_quizzes_created_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_quizzes] PRIMARY KEY CLUSTERED ([quiz_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_quiz_attempts]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_quiz_attempts](
        [attempt_id] [bigint] IDENTITY(1,1) NOT NULL,
        [quiz_id] [bigint] NOT NULL,
        [user_id] [bigint] NOT NULL,
        [score] [decimal](5,2) NULL,
        [answers_json] [nvarchar](max) NULL,
        [completed_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_quiz_attempts_completed_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_quiz_attempts] PRIMARY KEY CLUSTERED ([attempt_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_flashcard_sets]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_flashcard_sets](
        [set_id] [bigint] IDENTITY(1,1) NOT NULL,
        [workspace_id] [bigint] NOT NULL,
        [document_id] [bigint] NULL,
        [title] [nvarchar](180) NOT NULL,
        [created_by] [bigint] NOT NULL,
        [cards_json] [nvarchar](max) NOT NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_flashcard_sets_created_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_flashcard_sets] PRIMARY KEY CLUSTERED ([set_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_flashcard_progress]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_flashcard_progress](
        [set_id] [bigint] NOT NULL,
        [user_id] [bigint] NOT NULL,
        [reviewed_count] [int] NOT NULL CONSTRAINT [DF_workspace_flashcard_progress_reviewed] DEFAULT (0),
        [total_count] [int] NOT NULL CONSTRAINT [DF_workspace_flashcard_progress_total] DEFAULT (0),
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_flashcard_progress_updated_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_flashcard_progress] PRIMARY KEY CLUSTERED ([set_id] ASC, [user_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[workspace_activity_logs]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[workspace_activity_logs](
        [activity_id] [bigint] IDENTITY(1,1) NOT NULL,
        [workspace_id] [bigint] NOT NULL,
        [user_id] [bigint] NULL,
        [activity_type] [varchar](40) NOT NULL,
        [entity_type] [varchar](40) NULL,
        [entity_id] [bigint] NULL,
        [description] [nvarchar](500) NOT NULL,
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_workspace_activity_logs_created_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_workspace_activity_logs] PRIMARY KEY CLUSTERED ([activity_id] ASC)
    )
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_invitation_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_invitations] WITH CHECK ADD CONSTRAINT [fk_workspace_invitation_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_invitation_inviter]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_invitations] WITH CHECK ADD CONSTRAINT [fk_workspace_invitation_inviter]
    FOREIGN KEY([invited_by]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_task_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_tasks] WITH CHECK ADD CONSTRAINT [fk_workspace_task_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_task_assigned_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_tasks] WITH CHECK ADD CONSTRAINT [fk_workspace_task_assigned_user]
    FOREIGN KEY([assigned_to]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_task_created_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_tasks] WITH CHECK ADD CONSTRAINT [fk_workspace_task_created_user]
    FOREIGN KEY([created_by]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_post_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_posts] WITH CHECK ADD CONSTRAINT [fk_workspace_post_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_post_author]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_posts] WITH CHECK ADD CONSTRAINT [fk_workspace_post_author]
    FOREIGN KEY([author_id]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_post_document]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_posts] WITH CHECK ADD CONSTRAINT [fk_workspace_post_document]
    FOREIGN KEY([attached_document_id]) REFERENCES [dbo].[documents] ([document_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_post_comment_post]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_post_comments] WITH CHECK ADD CONSTRAINT [fk_workspace_post_comment_post]
    FOREIGN KEY([post_id]) REFERENCES [dbo].[workspace_posts] ([post_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_post_comment_user]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_post_comments] WITH CHECK ADD CONSTRAINT [fk_workspace_post_comment_user]
    FOREIGN KEY([user_id]) REFERENCES [dbo].[users] ([user_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_ai_output_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_ai_outputs] WITH CHECK ADD CONSTRAINT [fk_workspace_ai_output_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_ai_output_document]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_ai_outputs] WITH CHECK ADD CONSTRAINT [fk_workspace_ai_output_document]
    FOREIGN KEY([document_id]) REFERENCES [dbo].[documents] ([document_id])
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_quiz_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_quizzes] WITH CHECK ADD CONSTRAINT [fk_workspace_quiz_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_quiz_attempt_quiz]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_quiz_attempts] WITH CHECK ADD CONSTRAINT [fk_workspace_quiz_attempt_quiz]
    FOREIGN KEY([quiz_id]) REFERENCES [dbo].[workspace_quizzes] ([quiz_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_flashcard_set_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_flashcard_sets] WITH CHECK ADD CONSTRAINT [fk_workspace_flashcard_set_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_flashcard_progress_set]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_flashcard_progress] WITH CHECK ADD CONSTRAINT [fk_workspace_flashcard_progress_set]
    FOREIGN KEY([set_id]) REFERENCES [dbo].[workspace_flashcard_sets] ([set_id]) ON DELETE CASCADE
END
GO

IF OBJECT_ID(N'[dbo].[fk_workspace_activity_workspace]', N'F') IS NULL
BEGIN
    ALTER TABLE [dbo].[workspace_activity_logs] WITH CHECK ADD CONSTRAINT [fk_workspace_activity_workspace]
    FOREIGN KEY([workspace_id]) REFERENCES [dbo].[workspaces] ([workspace_id]) ON DELETE CASCADE
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_workspace_tasks_workspace' AND object_id = OBJECT_ID(N'[dbo].[workspace_tasks]'))
BEGIN
    CREATE INDEX [idx_workspace_tasks_workspace] ON [dbo].[workspace_tasks]([workspace_id], [status])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_workspace_posts_workspace' AND object_id = OBJECT_ID(N'[dbo].[workspace_posts]'))
BEGIN
    CREATE INDEX [idx_workspace_posts_workspace] ON [dbo].[workspace_posts]([workspace_id], [pinned], [created_at])
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'idx_workspace_activity_workspace' AND object_id = OBJECT_ID(N'[dbo].[workspace_activity_logs]'))
BEGIN
    CREATE INDEX [idx_workspace_activity_workspace] ON [dbo].[workspace_activity_logs]([workspace_id], [created_at])
END
GO
