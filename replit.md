# JCET Hub

A Smart Campus Management & Engagement Platform for college operations.

## Stack

- **Frontend:** React + Vite + Tailwind CSS 4 + Framer Motion (`artifacts/jcethub/`)
- **Backend:** Express.js + TypeScript + WebSockets (`artifacts/api-server/`)
- **Database:** PostgreSQL via Drizzle ORM (`lib/db/`)
- **API contract:** OpenAPI spec in `lib/api-spec/`, React Query hooks auto-generated in `lib/api-client-react/`
- **Package manager:** pnpm workspaces (monorepo)

## Features

- Event management & registration
- QR-based attendance tracking
- Role-based dashboards (Admin, Faculty, Student)
- Campus activity points & badge system
- Student resume builder
- Real-time updates via WebSockets (dev/persistent-server only)

## Running on Replit

Both services start automatically via the configured workflows:

| Service    | Workflow                            | Port |
|------------|-------------------------------------|------|
| API Server | `artifacts/api-server: API Server`  | 8080 |
| Frontend   | `artifacts/jcethub: web`            | 19904 |

Demo credentials appear on the login page (Student / Faculty / Admin quick-fill buttons).

## Database

Uses Replit's built-in PostgreSQL. Push schema changes with:

```sh
pnpm --filter @workspace/db run push
```

Demo data is seeded automatically on first start (idempotent — skips if data exists).

## Deploying to Vercel

The project is Vercel-ready out of the box.

### 1. Provision a PostgreSQL database

Use any Vercel-compatible provider:
- **[Neon](https://neon.tech)** (recommended — generous free tier, serverless-optimised)
- Supabase, Railway, or any `DATABASE_URL`-based PostgreSQL

Push the schema to your production database once:

```sh
DATABASE_URL="postgresql://..." pnpm --filter @workspace/db run push
```

### 2. Set environment variables in Vercel

In your Vercel project → Settings → Environment Variables:

| Variable        | Value                                              |
|-----------------|----------------------------------------------------|
| `DATABASE_URL`  | Your production PostgreSQL connection string        |
| `SESSION_SECRET`| A long random base64 string (64+ bytes)            |

### 3. Deploy

```sh
vercel --prod
```

Or connect the GitHub repo to Vercel and it will auto-deploy on every push.

### How it works on Vercel

| Concern       | Approach                                                               |
|---------------|------------------------------------------------------------------------|
| Frontend      | Vite static build → served from Vercel CDN (`outputDirectory`)        |
| API           | Express app at `api/index.ts` → Vercel serverless function            |
| Routing       | `/api/*` → serverless function; everything else → `index.html` (SPA) |
| Demo seed     | Runs once on first cold-start; fast COUNT guard skips on subsequent starts |
| Socket.io     | Disabled in production (serverless has no persistent TCP); set `VITE_SOCKET_URL` to a dedicated socket server to re-enable |

### Re-enabling real-time features (optional)

Deploy the API server as a persistent process (Railway, Fly.io, Render) and set:

```
VITE_SOCKET_URL=https://your-socket-server.railway.app
```

in Vercel environment variables. The frontend will connect there for live updates.

## Environment variables

| Key               | Scope    | Description                                              |
|-------------------|----------|----------------------------------------------------------|
| `DATABASE_URL`    | Server   | Managed automatically on Replit; set manually on Vercel |
| `SESSION_SECRET`  | Server   | Session signing secret (set as Replit Secret)           |
| `VITE_API_URL`    | Frontend | Override API base URL (leave empty to use same domain)  |
| `VITE_SOCKET_URL` | Frontend | Optional dedicated socket server URL for real-time      |

## User preferences

- Keep the existing monorepo structure
- Use pnpm for all package management
