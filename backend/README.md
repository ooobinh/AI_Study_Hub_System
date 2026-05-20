# AI Study Hub Backend

Spring Boot REST API for the AI Study Hub prototype.

## Run

1. Create the SQL Server database with:

   `../database/ai_study_hub_sql_server.sql`

2. Start the API:

   ```bash
   mvn spring-boot:run
   ```

   On Windows PowerShell, you can also create `backend/.env` from `backend/.env.example` and run:

   ```powershell
   .\run-dev.ps1
   ```

By default the API runs at `http://localhost:8080`.

## Environment

```bash
DB_URL=jdbc:sqlserver://localhost:1433;databaseName=AI_Study_Hub;encrypt=true;trustServerCertificate=true
DB_USERNAME=SA
DB_PASSWORD=12345
CORS_ALLOWED_ORIGIN_PATTERNS=http://localhost:3000,http://127.0.0.1:3000,http://192.168.*.*:3000,http://10.*.*.*:3000,http://172.*.*.*:3000
UPLOAD_DIR=uploads
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=documents
```

## Main Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/users/{id}`
- `GET /api/documents`
- `POST /api/documents`
- `GET /api/documents/{id}`
- `PUT /api/documents/{id}`
- `DELETE /api/documents/{id}`
- `POST /api/documents/{id}/favorite?userId=1`
- `GET /api/chat/sessions?userId=1`
- `POST /api/chat/sessions`
- `GET /api/chat/sessions/{sessionId}/messages`
- `POST /api/chat/sessions/{sessionId}/messages`
- `POST /api/chat/sessions/{sessionId}/ai-messages`
- `GET /api/analytics/summary`
- `GET /api/admin/users`
- `GET /api/admin/documents/pending`
- `POST /api/uploads/documents`
- `GET /api/uploads/storage/status`

The frontend uploads files to `POST /api/uploads/documents`.

If `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` are configured, the backend uploads files to Supabase Storage. Keep the service role key only on the backend. If Supabase is not configured, files are stored under `backend/uploads` by default and served from `/uploads/**`.

Use `GET /api/uploads/storage/status` to confirm that the backend can see the configured Supabase bucket.

Seed users:

- `binh@example.com` / `password123`
- `admin@example.com` / `admin123`
