SET NOCOUNT ON;

IF OBJECT_ID(N'[dbo].[document_folders]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[document_folders](
        [folder_id] [bigint] IDENTITY(1,1) NOT NULL,
        [owner_id] [bigint] NOT NULL,
        [folder_name] [nvarchar](150) NOT NULL,
        [status] [varchar](20) NOT NULL CONSTRAINT [DF_document_folders_status] DEFAULT ('ACTIVE'),
        [created_at] [datetime2](7) NOT NULL CONSTRAINT [DF_document_folders_created_at] DEFAULT (sysdatetime()),
        [updated_at] [datetime2](7) NOT NULL CONSTRAINT [DF_document_folders_updated_at] DEFAULT (sysdatetime()),
        CONSTRAINT [PK_document_folders] PRIMARY KEY CLUSTERED ([folder_id] ASC),
        CONSTRAINT [FK_document_folders_owner] FOREIGN KEY([owner_id])
            REFERENCES [dbo].[users] ([user_id]),
        CONSTRAINT [CHK_document_folders_status] CHECK ([status] IN ('ACTIVE', 'DELETED'))
    );
END
GO

IF COL_LENGTH(N'dbo.documents', N'folder_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[documents]
    ADD [folder_id] [bigint] NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE [name] = N'FK_documents_folder'
      AND [parent_object_id] = OBJECT_ID(N'dbo.documents')
)
BEGIN
    ALTER TABLE [dbo].[documents] WITH CHECK ADD CONSTRAINT [FK_documents_folder]
    FOREIGN KEY([folder_id]) REFERENCES [dbo].[document_folders] ([folder_id]);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE [name] = N'IX_document_folders_owner_status'
      AND [object_id] = OBJECT_ID(N'dbo.document_folders')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_document_folders_owner_status]
    ON [dbo].[document_folders]([owner_id], [status], [created_at] DESC);
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE [name] = N'IX_documents_folder'
      AND [object_id] = OBJECT_ID(N'dbo.documents')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_documents_folder]
    ON [dbo].[documents]([folder_id], [status]);
END
GO
