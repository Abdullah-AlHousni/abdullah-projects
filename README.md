# [Chirp](https://chirps-project.vercel.app/) MVP

Chirp is a social media MVP (Mini Twitter/X) where users can sign up, share 280-character updates, attach optimized media, and engage with likes, comments, rechirps (retweets), and fact checks. The stack is a TypeScript Express API (PostgreSQL + Prisma + AWS S3 + Gemini) paired with a React + Tailwind frontend powered by React Query. Try it out @ [Chirp](https://chirps-project.vercel.app/)

## Repository Layout

```
CHIRP/
├─ backend/        # Express API, Prisma schema, media & fact-check pipeline
├─ frontend/       # React app with Tailwind, React Router, React Query
└─ README.md       # Project guide
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (local install or managed instance e.g. Render, Supabase)
- AWS account with an S3 bucket (Object Ownership: Bucket owner enforced, or equivalent policy)
- Google AI Studio API key (Gemini) for fact checking

---

## Backend Setup (`/backend`)

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Required keys:
   - `DATABASE_URL` – PostgreSQL connection string (append `?sslmode=require` for managed hosts)
   - `JWT_SECRET` – long random string
   - `FRONTEND_ORIGIN` – e.g. `http://localhost:5173`
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME` – credentials for S3 media storage
   - `GEMINI_API_KEY` – Google AI Studio API key (Gemini 1.5 Flash)
   - `FACTCHECK_MODE` – `direct` (Gemini-only, default) or `legacy` (Wikipedia + Gemini)

3. **Apply database schema**
   ```bash
   npx prisma migrate dev --name add_fact_checks
   ```
   Use `npx prisma migrate deploy` when targeting production databases.

4. **Run the API**
   ```bash
   npm run dev
   ```
   The server listens on `http://localhost:4000` with a `/health` probe.

### Fact-Check Pipeline

- `/upload` accepts media (≤20 MB) from authenticated users, optimises via Sharp (images) or FFmpeg (videos), and uploads to S3.
- Each chirp can request one fact check via `/api/factcheck/:chirpId`. Fact checks:
  1. Gate obviously subjective content → `NEEDS_CONTEXT`.
  2. **Direct mode (default):** Send claim only to Gemini for judgment. Citations are mandatory—verdicts without reputable URLs downgrade to `INSUFFICIENT_EVIDENCE`.
  3. **Legacy mode:** Existing Wikipedia retrieval + Gemini adjudication (toggle via `FACTCHECK_MODE=legacy`).
  4. Save verdict, confidence, summary, citations, timestamps in `fact_checks`.
  5. Cache results—subsequent POSTs reuse the stored record.

### Key API Routes

| Method | Route                                      | Description                                          |
| ------ | ------------------------------------------ | ---------------------------------------------------- |
| POST   | `/auth/signup`                             | Create a new user account                            |
| POST   | `/auth/login`                              | Exchange credentials for a JWT                       |
| GET    | `/auth/me`                                 | Fetch the authenticated user                         |
| POST   | `/upload`                                  | Upload/optimise media → `{ url, mediaType }`         |
| POST   | `/chirps`                                  | Publish a chirp with optional `mediaUrl/mediaType`   |
| GET    | `/chirps/feed`                             | Latest chirps (reverse chronological)                |
| GET    | `/chirps/:chirpId`                         | Single chirp with comments                           |
| GET    | `/chirps/user/:username`                   | Chirps authored by a user                            |
| POST   | `/engagements/chirps/:id/like`             | Like a chirp                                         |
| DELETE | `/engagements/chirps/:id/like`             | Remove a like                                        |
| POST   | `/engagements/chirps/:id/comments`         | Comment on a chirp                                   |
| GET    | `/engagements/chirps/:id/comments`         | List comments (auth required)                        |
| POST   | `/engagements/chirps/:id/rechirp`          | Rechirp a chirp                                      |
| DELETE | `/engagements/chirps/:id/rechirp`          | Undo a rechirp                                       |
| GET    | `/profiles/:username`                      | Public profile with chirps and media                 |
| POST   | `/api/factcheck/:chirpId`                  | Schedule a fact check for the chirp (idempotent)     |
| GET    | `/api/factcheck/:chirpId`                  | Fetch the current fact-check record for the chirp    |

---

## Frontend Setup (`/frontend`)

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment variables**
   ```bash
   cp .env.example .env
   ```
   - `VITE_API_BASE_URL` – e.g. `http://localhost:4000`

3. **Run Vite**
   ```bash
   npm run dev
   ```
   The SPA is served at `http://localhost:5173`.

4. **Branding asset (optional)**
   - Place your logo at `frontend/public/chirp_logo.png`.
   - The header displays it automatically and the favicon uses the same file.

### Frontend Highlights

- Feed and profile pages display fact-check badges for every chirp.
- Badges show live state (Unverified, Checking, Verified, Disputed, Needs Context, Insufficient Evidence, Error).
- Clicking the badge opens a modal with summary, confidence, and citations. Unverified chirps can trigger a fact check on demand.
- After posting a chirp, the composer automatically schedules a fact check and the UI polls until completion.

---

## Deployment Notes

### PostgreSQL (Render managed Postgres example)
1. Provision the database and copy the `postgresql://` URI (append `?sslmode=require`).
2. Set `DATABASE_URL` in the backend environment.
3. Deploy migrations: `npx prisma migrate deploy`.
4. Optional: `npx prisma studio` to inspect data.

### Backend (Render)
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`, `GEMINI_API_KEY`, `FACTCHECK_MODE`
- Ensure the compute environment has permission to write to S3, call Gemini, and reach Postgres.

### Frontend (Vercel)
- Root directory: `/frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_API_BASE_URL=https://<backend-domain>`

---
