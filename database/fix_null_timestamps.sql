SET NOCOUNT ON;

DECLARE @targets TABLE (
    table_name sysname NOT NULL,
    column_name sysname NOT NULL
);

INSERT INTO @targets (table_name, column_name)
VALUES
    (N'users', N'created_at'),
    (N'users', N'updated_at'),
    (N'documents', N'created_at'),
    (N'documents', N'updated_at'),
    (N'document_shares', N'created_at'),
    (N'notifications', N'created_at'),
    (N'reports', N'created_at'),
    (N'chat_sessions', N'created_at'),
    (N'chat_sessions', N'updated_at'),
    (N'chat_messages', N'created_at'),
    (N'subjects', N'created_at'),
    (N'workspaces', N'created_at'),
    (N'workspaces', N'updated_at'),
    (N'workspace_members', N'joined_at'),
    (N'workspace_documents', N'created_at'),
    (N'workspace_messages', N'created_at'),
    (N'workspace_invitations', N'created_at'),
    (N'workspace_tasks', N'created_at'),
    (N'workspace_tasks', N'updated_at'),
    (N'workspace_posts', N'created_at'),
    (N'workspace_posts', N'updated_at'),
    (N'workspace_post_comments', N'created_at'),
    (N'workspace_ai_outputs', N'created_at'),
    (N'workspace_quizzes', N'created_at'),
    (N'workspace_flashcard_sets', N'created_at'),
    (N'workspace_flashcard_progress', N'updated_at'),
    (N'workspace_activity_logs', N'created_at'),
    (N'forum_posts', N'created_at'),
    (N'forum_posts', N'updated_at'),
    (N'forum_answers', N'created_at'),
    (N'forum_answers', N'updated_at'),
    (N'user_presence', N'last_seen_at');

DECLARE @tableName sysname;
DECLARE @columnName sysname;
DECLARE @objectName nvarchar(300);
DECLARE @sql nvarchar(max);
DECLARE @constraintName sysname;

DECLARE timestamp_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT table_name, column_name
    FROM @targets;

OPEN timestamp_cursor;
FETCH NEXT FROM timestamp_cursor INTO @tableName, @columnName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @objectName = N'dbo.' + @tableName;

    IF OBJECT_ID(@objectName, N'U') IS NOT NULL
       AND COL_LENGTH(@objectName, @columnName) IS NOT NULL
    BEGIN
        IF @columnName = N'updated_at'
           AND COL_LENGTH(@objectName, N'created_at') IS NOT NULL
        BEGIN
            SET @sql = N'UPDATE [dbo].' + QUOTENAME(@tableName) +
                N' SET ' + QUOTENAME(@columnName) + N' = COALESCE(' +
                QUOTENAME(@columnName) + N', [created_at], SYSDATETIME()) WHERE ' +
                QUOTENAME(@columnName) + N' IS NULL;';
        END
        ELSE
        BEGIN
            SET @sql = N'UPDATE [dbo].' + QUOTENAME(@tableName) +
                N' SET ' + QUOTENAME(@columnName) + N' = SYSDATETIME() WHERE ' +
                QUOTENAME(@columnName) + N' IS NULL;';
        END

        EXEC sp_executesql @sql;

        IF NOT EXISTS (
            SELECT 1
            FROM sys.default_constraints dc
            INNER JOIN sys.columns c
                ON c.object_id = dc.parent_object_id
               AND c.column_id = dc.parent_column_id
            WHERE dc.parent_object_id = OBJECT_ID(@objectName)
              AND c.name = @columnName
        )
        BEGIN
            SET @constraintName = LEFT(N'DF_' + @tableName + N'_' + @columnName + N'_auto', 128);
            SET @sql = N'ALTER TABLE [dbo].' + QUOTENAME(@tableName) +
                N' ADD CONSTRAINT ' + QUOTENAME(@constraintName) +
                N' DEFAULT (SYSDATETIME()) FOR ' + QUOTENAME(@columnName) + N';';

            EXEC sp_executesql @sql;
        END
    END

    FETCH NEXT FROM timestamp_cursor INTO @tableName, @columnName;
END

CLOSE timestamp_cursor;
DEALLOCATE timestamp_cursor;
