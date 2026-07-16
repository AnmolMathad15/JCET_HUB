/**
 * Vercel serverless entry-point.
 *
 * Imports the Express app (no PORT / server-listen code) and wraps it as a
 * Vercel-compatible handler.  Socket.io is intentionally omitted — it requires
 * a persistent TCP server which is not available in serverless environments.
 *
 * Required Vercel environment variables:
 *   DATABASE_URL  – PostgreSQL connection string (e.g. from Neon / Supabase)
 *   SESSION_SECRET – 64-byte random base64 string for session signing
 */

import app from "../artifacts/api-server/src/app";
import { seedDemoData } from "../artifacts/api-server/src/seed";

let seeded = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handler = async (req: any, res: any): Promise<void> => {
  // Run demo seed exactly once per function instance (fast guard inside prevents re-seeding).
  if (!seeded) {
    seeded = true;
    await seedDemoData().catch((err: unknown) =>
      console.error("[vercel] seed error:", err),
    );
  }
  app(req, res);
};

export default handler;
