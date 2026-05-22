DECLARE @AdminEmail varchar(150) = 'admin@example.com';
DECLARE @AdminPasswordHash varchar(255) = '$2a$10$83cE5EdlLYssMSzffB/1dOVSfjBJ0rbNVLJHLV8G1BGjyPEG4Qzru';
DECLARE @AdminUserId bigint;
DECLARE @AdminRoleId bigint;

IF EXISTS (SELECT 1 FROM [dbo].[users] WHERE [email] = @AdminEmail)
BEGIN
    UPDATE [dbo].[users]
    SET [password_hash] = @AdminPasswordHash,
        [status] = 'ACTIVE',
        [updated_at] = SYSDATETIME()
    WHERE [email] = @AdminEmail;

    SELECT @AdminUserId = [user_id]
    FROM [dbo].[users]
    WHERE [email] = @AdminEmail;
END
ELSE
BEGIN
    INSERT INTO [dbo].[users] (
        [full_name],
        [email],
        [password_hash],
        [university],
        [major],
        [status],
        [created_at],
        [updated_at]
    )
    VALUES (
        N'AI Study Hub Admin',
        @AdminEmail,
        @AdminPasswordHash,
        N'AI Study Hub',
        N'Administration',
        'ACTIVE',
        SYSDATETIME(),
        SYSDATETIME()
    );

    SET @AdminUserId = SCOPE_IDENTITY();
END

SELECT @AdminRoleId = [role_id]
FROM [dbo].[roles]
WHERE [role_name] = 'ADMIN';

IF @AdminRoleId IS NULL
BEGIN
    INSERT INTO [dbo].[roles] ([role_name], [description])
    VALUES ('ADMIN', N'System administrator');

    SET @AdminRoleId = SCOPE_IDENTITY();
END

INSERT INTO [dbo].[user_roles] ([user_id], [role_id])
SELECT @AdminUserId, @AdminRoleId
WHERE NOT EXISTS (
    SELECT 1
    FROM [dbo].[user_roles]
    WHERE [user_id] = @AdminUserId
      AND [role_id] = @AdminRoleId
);

UPDATE u
SET [status] = 'ACTIVE',
    [updated_at] = SYSDATETIME()
FROM [dbo].[users] u
INNER JOIN [dbo].[user_roles] ur ON ur.[user_id] = u.[user_id]
INNER JOIN [dbo].[roles] r ON r.[role_id] = ur.[role_id]
WHERE r.[role_name] = 'ADMIN'
  AND u.[status] <> 'ACTIVE';
