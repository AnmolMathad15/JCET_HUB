import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { attendanceTable, marksTable, notificationsTable, eventsTable } from "@workspace/db/schema";
import { eq, and, gte } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string ?? "student-001";

    const attendanceRecords = await db.select().from(attendanceTable).where(eq(attendanceTable.userId, userId));
    const overallAttendance = attendanceRecords.length > 0
      ? Math.round(attendanceRecords.reduce((s, r) => s + r.percentage, 0) / attendanceRecords.length)
      : 0;

    const marksRecords = await db.select().from(marksTable).where(eq(marksTable.userId, userId));
    const avgMarks = marksRecords.length > 0
      ? marksRecords.reduce((s, r) => s + ((r.ia1 + r.ia2 + r.ia3) / 3), 0) / marksRecords.length
      : 0;
    const cgpa = parseFloat(((avgMarks / 100) * 10).toFixed(2));

    const unreadCount = await db.select().from(notificationsTable).where(
      eq(notificationsTable.isRead, false)
    );

    const today = new Date().toISOString().split("T")[0];
    const upcomingEvents = await db.select().from(eventsTable).where(
      gte(eventsTable.date, today)
    );

    const examEvent = upcomingEvents.find(e => e.type === "exam");
    const nextExamDays = examEvent
      ? Math.ceil((new Date(examEvent.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0;

    res.json({
      overallAttendance,
      cgpa: cgpa > 0 ? cgpa : 8.4,
      pendingAssignments: 3,
      unreadNotifications: unreadCount.length,
      currentSemester: "5th Semester",
      nextExamDays: nextExamDays > 0 ? nextExamDays : 12,
      creditsCompleted: 110,
      creditsTotal: 160,
    });
  } catch (err) {
    req.log.error({ err }, "Get dashboard summary error");
    res.status(500).json({ error: "server_error", message: "Internal server error" });
  }
});

router.post("/dashboard/events", async (req, res) => {
  try {
    const { title, description, date, type, venue } = req.body ?? {};
    if (!title || !date) return res.status(400).json({ error: "validation_error", message: "title and date required" });
    await db.insert(eventsTable).values({ title, description: description ?? "", date, type: type ?? "general", venue: venue ?? "" });
    res.status(201).json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Post event error");
    res.status(500).json({ error: "server_error" });
  }
});

router.get("/dashboard/events", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const records = await db.select().from(eventsTable).where(
      gte(eventsTable.date, today)
    );

    res.json(records.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description ?? "",
      date: r.date,
      type: r.type,
      venue: r.venue ?? "",
    })));
  } catch (err) {
    req.log.error({ err }, "Get events error");
    res.status(500).json({ error: "server_error", message: "Internal server error" });
  }
});

export default router;
