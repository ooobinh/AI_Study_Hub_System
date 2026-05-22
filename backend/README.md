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

## Render Deployment

This backend is a Spring Boot service. Deploy it as Java/Maven or with the included `Dockerfile`.
Do not deploy it as a Node service.

Required production environment variables:

- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `CORS_ALLOWED_ORIGIN_PATTERNS=https://your-vercel-app.vercel.app`
- `APP_FRONTEND_URL=https://your-vercel-app.vercel.app`
- `GOOGLE_CLIENT_ID=...apps.googleusercontent.com`
- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`
- `GEMINI_API_KEY`
- `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

Vercel frontend also needs:

- `NEXT_PUBLIC_API_URL=https://your-render-service.onrender.com`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...apps.googleusercontent.com`

## Environment

```bash
DB_URL=jdbc:sqlserver://localhost:1433;databaseName=AI_Study_Hub;encrypt=true;trustServerCertificate=true
DB_USERNAME=SA
DB_PASSWORD=12345
CORS_ALLOWED_ORIGIN_PATTERNS=*
UPLOAD_DIR=uploads
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=documents
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
GOOGLE_CLIENT_ID=your-google-web-oauth-client-id.apps.googleusercontent.com
APP_FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=your-resend-api-key
RESEND_FROM_EMAIL=AI Study Hub <onboarding@resend.dev>
```

## Main Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/google`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
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
- `POST /api/chat/sessions/{sessionId}/ask`
- `GET /api/analytics/summary`
- `GET /api/admin/users`
- `GET /api/admin/documents/pending`
- `POST /api/uploads/documents`
- `GET /api/uploads/storage/status`

The frontend uploads files to `POST /api/uploads/documents`.

If `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_STORAGE_BUCKET` are configured, the backend uploads files to Supabase Storage. Keep the service role key only on the backend. If Supabase is not configured, files are stored under `backend/uploads` by default and served from `/uploads/**`.

Use `GET /api/uploads/storage/status` to confirm that the backend can see the configured Supabase bucket.

If `GEMINI_API_KEY` is configured, uploaded documents are processed by Gemini after storage:

- extract readable document text
- rename the document title
- classify subject and category
- create tags, chunks, and a summary
- answer chat questions with document context when a chat session is linked to a document

Password reset links use the frontend request origin when available. If the app is opened through a public URL, the reset email will point to that public URL. `APP_FRONTEND_URL` is only the fallback for direct API calls.

Google login uses Google Identity Services on the frontend and verifies the returned ID token on the backend. Put the same Web OAuth Client ID in both places:

- backend `.env`: `GOOGLE_CLIENT_ID=...apps.googleusercontent.com`
- frontend `.env.local`: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...apps.googleusercontent.com`

The value must be an OAuth 2.0 Web Client ID, not a Google API key.

Seed users:

- `binh@example.com` / `password123`
- `admin@example.com` / `admin123`
