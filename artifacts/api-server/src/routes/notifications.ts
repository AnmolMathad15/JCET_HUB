import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/notifications", async (req, res) => {
  try {
    const { title, message, type } = req.body ?? {};
    if (!title || !message) return res.status(400).json({ error: "validation_error", message: "title and message required" });
    await db.insert(notificationsTable).values({ title, message, type: type ?? "info", isRead: false });
    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Post notification error");
    res.status(500).json({ error: "server_error" });
  }
});

router.get("/notifications", async (req, res) => {
  try {
    const records = await db.select().from(notificationsTable).orderBy(desc(notificationsTable.createdAt));

    res.json(records.map(r => ({
      id: r.id,
      title: r.title,
      message: r.message,
      type: r.type,
      isRead: r.isRead,
      createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Get notifications error");
    res.status(500).json({ error: "server_error", message: "Internal server error" });
  }
});

export default router;
