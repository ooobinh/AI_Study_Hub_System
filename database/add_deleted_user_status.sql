IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE [name] = N'chk_users_status'
      AND [parent_object_id] = OBJECT_ID(N'[dbo].[users]')
)
BEGIN
    ALTER TABLE [dbo].[users] DROP CONSTRAINT [chk_users_status]
END
GO

ALTER TABLE [dbo].[users] WITH CHECK ADD CONSTRAINT [chk_users_status]
CHECK (([status] = 'DELETED' OR [status] = 'BANNED' OR [status] = 'INACTIVE' OR [status] = 'ACTIVE'))
GO

ALTER TABLE [dbo].[users] CHECK CONSTRAINT [chk_users_status]
GO
