import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected", ts: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "unknown";
    res.status(503).json({ status: "error", db: "disconnected", error: message });
  }
});

export default router;
