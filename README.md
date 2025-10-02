# Chirp MVP

Chirp is a social media MVP where users can sign up, share 280-character updates, attach optimized media, and engage with likes, comments, and rechirps (retweets). The stack is a TypeScript Express API (PostgreSQL + Prisma + AWS S3) paired with a React + Tailwind frontend powered by React Query.

## Repository Layout

```
CHIRP/
├─ backend/        # Express API, Prisma schema, media pipeline (Sharp + FFmpeg + S3)
├─ frontend/       # React app with Tailwind, React Router, React Query
└─ README.md       # Project guide
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (local install or managed instance)
- AWS account with an S3 bucket (Object Ownership: Bucket owner enforced, or equivalent policy)

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
   Update the new `.env` with:
   - `DATABASE_URL` – PostgreSQL connection string
   - `JWT_SECRET` – long random string
   - `FRONTEND_ORIGIN` – e.g. `http://localhost:5173`
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` – IAM credentials with S3 write access
   - `AWS_REGION` – e.g. `us-east-1`
   - `AWS_BUCKET_NAME` – bucket for media (`chirp-media` by default)

   > **Note:** If your bucket enforces "Bucket owner enforced" object ownership (recommended), set a bucket policy that grants public `s3:GetObject` and allows the IAM principal to `s3:PutObject`. Object ACLs are not used.

3. **Apply database schema**
   ```bash
   npx prisma migrate dev --name add-media-fields
   ```
   (Use a different migration name if you already ran earlier migrations.)

4. **Run the API**
   ```bash
   npm run dev
   ```
   The server listens on `http://localhost:4000` with a `/health` probe.

### Media Pipeline Details

- Uploads hit `POST /upload` (authenticated).
- Files are received via Multer (memory storage) with a strict 20 MB size cap.
- Images are resized to max 1080px width and converted to WebP (~70% quality) using Sharp.
- Videos are transcoded to MP4 (H.264 + AAC, max 720p) via FFmpeg with fast-start enabled.
- Optimized buffers are stored in S3 with unique keys (`chirps/<timestamp>-<uuid>.<ext>`).
- The S3 URL and media type are returned to the client and saved on the `Chirp` record (`mediaUrl`, `mediaType`).

### Key API Routes

| Method | Route                                      | Description                                          |
| ------ | ------------------------------------------ | ---------------------------------------------------- |
| POST   | `/auth/signup`                             | Create a new user account                            |
| POST   | `/auth/login`                              | Exchange credentials for a JWT                       |
| GET    | `/auth/me`                                 | Fetch the authenticated user                         |
| POST   | `/upload`                                  | Upload/optimise media → returns `{ url, mediaType }` |
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

### Useful Commands

- `npm run dev` – watch-mode server
- `npm run build` – produce production build (`dist/`)
- `npm run start` – run the compiled server
- `npm run prisma:generate` – regenerate Prisma client
- `npx prisma studio` – inspect data via Prisma Studio

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
   - `VITE_API_BASE_URL` – usually `http://localhost:4000`

3. **Run Vite**
   ```bash
   npm run dev
   ```
   The SPA is served at `http://localhost:5173`.

4. **Branding asset (optional)**
   - Place your logo at `frontend/public/chirp_logo.png`.
   - The header automatically displays the image (with ALT text fallback) and the browser tab uses it as the favicon.

### Frontend Highlights

- Protected feed requires login, but profile pages are public.
- The composer supports image/video selection with live preview and size validation (≤20 MB).
- On submit the UI uploads media to `/upload`, receives the S3 URL, and posts the chirp with `mediaUrl/mediaType`.
- Feed/profile cards display media responsively (`<img>` or `<video>`), update counts instantly, and keep engagement highlights in sync via React Query cache updates.

---

## Deployment Notes

### PostgreSQL (Supabase / Railway)
1. Provision a database and grab the connection string.
2. Set `DATABASE_URL` in the backend environment.
3. Deploy migrations:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
4. Optionally tunnel into the DB to inspect data with Prisma Studio.

### Backend (Render / Railway / AWS ECS, etc.)
- Build command: `npm install && npm run build`
- Start command: `npm run start`
- Required environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`
- Ensure the compute environment has permission to write to S3, and the bucket policy allows public `GetObject` if you need public URLs.

### Frontend (Vercel)
- Root directory: `/frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: `VITE_API_BASE_URL=https://<backend-domain>`

---

## Testing Tips

### Postman / Hoppscotch
1. Authenticate once with `POST /auth/login` and store the bearer token.
2. Upload an image via `POST /upload` (form-data field `file`). Response returns the S3 URL.
3. Post a chirp with `POST /chirps` using JSON:
   ```json
   {
     "content": "Hello Chirp!",
     "mediaUrl": "https://<bucket>.s3.amazonaws.com/chirps/...",
     "mediaType": "image"
   }
   ```
4. Verify it appears in `GET /chirps/feed` and `GET /profiles/<username>`.

### Local E2E Smoke Test
1. Run `npm run dev` in `/backend`.
2. Run `npm run dev` in `/frontend`.
3. Create an account, upload an image/video, confirm the preview, post, and ensure the media renders in the feed/profile.
4. Exercise likes, comments, and rechirps to confirm counters stay in sync when navigating between feed and profile.

---

## Next Steps / Enhancements

- Add viewer-specific flags from the API (`viewerHasLiked`, `viewerHasRechirped`) instead of computing on the client.
- Support animated GIF to MP4 conversion explicitly.
- Add background jobs for further media optimisation / thumbnailing.
- Introduce rate limiting and request logging (e.g. pino + AWS CloudWatch).
- Build automated tests (Jest + Supertest for API, Vitest + RTL for UI).

Happy chirping! 🐦
