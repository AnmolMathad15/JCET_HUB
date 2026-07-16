# JCET Hub

A Smart Campus Management & Engagement Platform for college operations.

## Stack

- **Frontend:** React + Vite + Tailwind CSS 4 + Framer Motion (`artifacts/jcethub/`)
- **Backend:** Express.js + TypeScript + WebSockets (`artifacts/api-server/`)
- **Database:** PostgreSQL (Replit-managed) via Drizzle ORM (`lib/db/`)
- **API contract:** OpenAPI spec in `lib/api-spec/`, React Query hooks auto-generated in `lib/api-client-react/`
- **Package manager:** pnpm workspaces

## Features

- Event management & registration
- QR-based attendance tracking
- Role-based dashboards (Admin, Faculty, Student)
- Campus activity points & badge system
- Student resume builder
- Real-time updates via WebSockets

## Running locally

Both services start automatically via the configured workflows:

| Service    | Workflow                       | Port |
|------------|-------------------------------|------|
| API Server | `artifacts/api-server: API Server` | 8080 |
| Frontend   | `artifacts/jcethub: web`      | 19904 |

## Database

Uses Replit's built-in PostgreSQL. To push schema changes:

```sh
pnpm --filter @workspace/db run push
```

## Environment variables

| Key              | Description                                |
|------------------|--------------------------------------------|
| `DATABASE_URL`   | Managed automatically by Replit            |
| `SESSION_SECRET` | Secret for session signing (set as secret) |

## User preferences

- Keep the existing monorepo structure
- Use pnpm for all package management
