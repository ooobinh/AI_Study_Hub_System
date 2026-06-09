SET NOCOUNT ON;

IF COL_LENGTH(N'dbo.subjects', N'owner_id') IS NULL
BEGIN
    ALTER TABLE [dbo].[subjects]
    ADD [owner_id] [bigint] NULL;
END

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE [name] = N'IX_subjects_owner'
      AND [object_id] = OBJECT_ID(N'dbo.subjects')
)
BEGIN
    CREATE NONCLUSTERED INDEX [IX_subjects_owner]
    ON [dbo].[subjects]([owner_id], [subject_name]);
END
