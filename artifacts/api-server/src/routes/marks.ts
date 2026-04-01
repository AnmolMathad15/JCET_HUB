import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { marksTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

interface MarksUpload { id: string; studentUsn: string; subject: string; subjectCode: string; ia1: number; ia2: number; uploadedBy: string; uploadedAt: string; }
const marksUploads: MarksUpload[] = [];

router.get("/marks/uploads", (_req, res) => {
  res.json(marksUploads);
});

router.post("/marks/upload", (req, res) => {
  const { studentUsn, subject, subjectCode, ia1, ia2, uploadedBy } = req.body ?? {};
  if (!studentUsn || !subject || ia1 === undefined || !uploadedBy) {
    return res.status(400).json({ error: "validation_error", message: "studentUsn, subject, ia1, and uploadedBy required" });
  }
  const record: MarksUpload = {
    id: `mrk${Date.now()}`,
    studentUsn: String(studentUsn).toUpperCase(),
    subject,
    subjectCode: subjectCode ?? "",
    ia1: Number(ia1), ia2: Number(ia2 ?? 0),
    uploadedBy,
    uploadedAt: new Date().toISOString(),
  };
  marksUploads.unshift(record);
  res.status(201).json({ success: true, record });
});

router.get("/marks/me", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string ?? "student-001";

    const records = await db.select().from(marksTable).where(eq(marksTable.userId, userId));

    res.json(records.map(r => ({
      subject: r.subject,
      subjectCode: r.subjectCode,
      ia1: r.ia1,
      ia2: r.ia2,
      finalMarks: r.finalMarks,
      maxMarks: r.maxMarks,
      grade: r.grade ?? "A",
    })));
  } catch (err) {
    req.log.error({ err }, "Get marks error");
    res.status(500).json({ error: "server_error", message: "Internal server error" });
  }
});

export default router;
