import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { attendanceTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

interface AttendanceUpload { id: string; studentUsn: string; subject: string; subjectCode: string; attended: number; total: number; updatedBy: string; updatedAt: string; }
const attendanceUploads: AttendanceUpload[] = [];

router.get("/attendance/me", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string ?? "student-001";
    const records = await db.select().from(attendanceTable).where(eq(attendanceTable.userId, userId));
    res.json(records.map(r => ({
      subject: r.subject,
      subjectCode: r.subjectCode,
      attended: r.attended,
      total: r.total,
      percentage: r.percentage,
      status: r.status,
    })));
  } catch (err) {
    req.log.error({ err }, "Get attendance error");
    res.status(500).json({ error: "server_error", message: "Internal server error" });
  }
});

router.post("/attendance/upload", (req, res) => {
  const { studentUsn, subject, subjectCode, attended, total, updatedBy } = req.body ?? {};
  if (!studentUsn || !subject || attended === undefined || total === undefined || !updatedBy) {
    return res.status(400).json({ error: "validation_error", message: "All fields are required" });
  }
  const record: AttendanceUpload = {
    id: `att${Date.now()}`,
    studentUsn: String(studentUsn).toUpperCase(),
    subject,
    subjectCode: subjectCode ?? "N/A",
    attended: Number(attended),
    total: Number(total),
    updatedBy,
    updatedAt: new Date().toISOString(),
  };
  attendanceUploads.unshift(record);
  res.status(201).json({ success: true, record });
});

router.get("/attendance/uploads", (_req, res) => {
  res.json(attendanceUploads);
});

export default router;
