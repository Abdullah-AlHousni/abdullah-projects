# Chirp MVP

Chirp is a social media MVP where users can sign up, share short 280-character messages, and engage with each other through likes, comments, and rechirps. The project is split into a TypeScript Express backend (PostgreSQL + Prisma) and a React + Tailwind frontend powered by React Query.

## Repo Layout

```
CHIRP/
├─ backend/        # Express API + Prisma models
├─ frontend/       # React app with Tailwind, React Router, React Query
└─ README.md       # Project guide
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (local install or managed provider like Supabase/Railway)

## Backend Setup (`/backend`)

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Copy the example environment file and update values:
   ```bash
   cp .env.example .env
   ```
   Required keys:
   - `DATABASE_URL` – PostgreSQL connection string (Supabase/Railway/local)
   - `JWT_SECRET` – strong secret for signing tokens
   - `FRONTEND_ORIGIN` – e.g. `http://localhost:5173`
3. Generate the Prisma client and run the first migration:
   ```bash
   npx prisma migrate dev --name init
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The API listens on `http://localhost:4000` and exposes a `/health` probe.

### Available API Routes

| Method | Route                                      | Description                     |
| ------ | ------------------------------------------ | ------------------------------- |
| POST   | `/auth/signup`                             | Create a new user account       |
| POST   | `/auth/login`                              | Exchange credentials for a JWT  |
| GET    | `/auth/me`                                 | Fetch the authenticated user    |
| POST   | `/chirps`                                  | Publish a chirp (text only)     |
| GET    | `/chirps/feed`                             | Latest chirps (reverse chrono)  |
| GET    | `/chirps/:chirpId`                         | Single chirp with comments      |
| GET    | `/chirps/user/:username`                   | Chirps authored by a user       |
| POST   | `/engagements/chirps/:id/like`             | Like a chirp                    |
| DELETE | `/engagements/chirps/:id/like`             | Remove a like                   |
| POST   | `/engagements/chirps/:id/comments`         | Comment on a chirp              |
| GET    | `/engagements/chirps/:id/comments`         | List comments                   |
| POST   | `/engagements/chirps/:id/rechirp`          | Rechirp a chirp                 |
| DELETE | `/engagements/chirps/:id/rechirp`          | Undo a rechirp                  |
| GET    | `/profiles/:username`                      | Public profile with chirps      |

### Useful Commands

- `npm run dev` – start the development server
- `npm run build` – emit production build (to `dist/`)
- `npm run start` – run the compiled server
- `npm run prisma:generate` – regenerate Prisma client
- `npx prisma studio` – open Prisma Studio to inspect data

## Frontend Setup (`/frontend`)

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Copy the env template and set the API origin:
   ```bash
   cp .env.example .env
   ```
   - `VITE_API_BASE_URL` – usually `http://localhost:4000`
3. Start Vite:
   ```bash
   npm run dev
   ```
   The app runs on `http://localhost:5173`.

The frontend ships with:
- React Router for auth + profile routing
- Auth context that stores tokens in `localStorage`
- React Query hooks for feed/profile/comments
- Tailwind CSS for styling
- Components for composing chirps, listing chirps, and commenting

## Deployment Guides

### PostgreSQL (Supabase or Railway)
1. Create a new project (Supabase: `New Project`, Railway: `Provision PostgreSQL`).
2. Whitelist your backend host if required.
3. Grab the connection string and set `DATABASE_URL` in the backend environment.
4. Run migrations on the managed instance:
   ```bash
   cd backend
   npx prisma migrate deploy
   ```
5. Optionally seed data or use `npx prisma studio --schema prisma/schema.prisma` via a tunnel.

### Backend on Render (Railway is similar)
1. Push this repo to GitHub.
2. Create a new **Web Service** on Render and point it to `/backend`.
3. Build command: `npm install && npm run build`
4. Start command: `npm run start`
5. Environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_ORIGIN` (your Vercel URL)
6. Enable automatic deploys so every push builds and releases.

### Frontend on Vercel
1. Import the repository into Vercel.
2. Set the root directory to `/frontend`.
3. Build command: `npm run build`
4. Output directory: `dist`
5. Environment variables:
   - `VITE_API_BASE_URL=https://your-render-backend.onrender.com`

## Testing Tips

- **Manual API verification:**
  - Use Postman or Hoppscotch with the routes listed above.
  - Authenticate once (`/auth/login`) and store the bearer token for subsequent calls.
- **Local end-to-end pass:**
  1. Run `npm run dev` in `/backend`.
  2. Run `npm run dev` in `/frontend`.
  3. Register a user, post chirps, and confirm likes/comments/rechirps update the feed.
- **Automated ideas (future work):**
  - Backend: add Jest + Supertest smoke tests per route.
  - Frontend: add Vitest + React Testing Library for core flows (auth, composer, feed rendering).

## Next Steps / Enhancements

- Add follower relationships and timeline filtering.
- Extend the feed endpoints to include viewer-specific flags (`viewerHasLiked`, etc.).
- Wire analytics/observability (e.g., Logflare on Supabase, Render logs).
- Harden validation and rate limiting for production.

Happy chirping! 🐦
