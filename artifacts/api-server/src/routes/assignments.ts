import { Router } from "express";
import { db } from "@workspace/db";
import { assignmentsTable, submissionsTable, usersTable } from "@workspace/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import crypto from "crypto";

const router = Router();

router.use(requireAuth);

function generateId() {
  return crypto.randomBytes(8).toString("hex");
}

router.get("/", async (req: AuthRequest, res) => {
  const user = req.currentUser!;
  let rows;

  if (user.role === "student") {
    rows = await db
      .select()
      .from(assignmentsTable)
      .where(
        user.batchId
          ? eq(assignmentsTable.batchId, user.batchId)
          : sql`true`
      )
      .orderBy(sql`${assignmentsTable.createdAt} DESC`);

    const withStatus = await Promise.all(
      rows.map(async (a) => {
        const [sub] = await db
          .select()
          .from(submissionsTable)
          .where(
            and(
              eq(submissionsTable.assignmentId, a.id),
              eq(submissionsTable.studentId, user.id)
            )
          );
        return { ...a, submission: sub ?? null };
      })
    );
    res.json(withStatus);
  } else if (user.role === "faculty") {
    rows = await db
      .select()
      .from(assignmentsTable)
      .where(eq(assignmentsTable.facultyId, user.id))
      .orderBy(sql`${assignmentsTable.createdAt} DESC`);
    res.json(rows);
  } else {
    rows = await db
      .select()
      .from(assignmentsTable)
      .orderBy(sql`${assignmentsTable.createdAt} DESC`);
    res.json(rows);
  }
});

router.post("/", requireRole("faculty", "admin"), async (req: AuthRequest, res) => {
  const { title, description, subjectId, subjectName, batchId, batchName, dueDate, maxMarks } = req.body;
  const user = req.currentUser!;

  if (!title) { res.status(400).json({ error: "title required" }); return; }

  const [assignment] = await db
    .insert(assignmentsTable)
    .values({
      id: generateId(),
      title,
      description,
      subjectId,
      subjectName,
      batchId,
      batchName,
      facultyId: user.id,
      facultyName: user.name,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      maxMarks: maxMarks ?? 10,
    })
    .returning();

  res.status(201).json(assignment);
});

router.get("/:id", async (req: AuthRequest, res) => {
  const [assignment] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, req.params.id));

  if (!assignment) { res.status(404).json({ error: "not found" }); return; }

  const user = req.currentUser!;

  if (user.role === "student") {
    const [sub] = await db
      .select()
      .from(submissionsTable)
      .where(
        and(
          eq(submissionsTable.assignmentId, assignment.id),
          eq(submissionsTable.studentId, user.id)
        )
      );
    res.json({ ...assignment, submission: sub ?? null });
  } else {
    const subs = await db
      .select()
      .from(submissionsTable)
      .where(eq(submissionsTable.assignmentId, assignment.id));
    res.json({ ...assignment, submissions: subs });
  }
});

router.delete("/:id", requireRole("faculty", "admin"), async (req: AuthRequest, res) => {
  const user = req.currentUser!;
  const [assignment] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, req.params.id));

  if (!assignment) { res.status(404).json({ error: "not found" }); return; }
  if (user.role === "faculty" && assignment.facultyId !== user.id) {
    res.status(403).json({ error: "forbidden" }); return;
  }

  await db.delete(submissionsTable).where(eq(submissionsTable.assignmentId, req.params.id));
  await db.delete(assignmentsTable).where(eq(assignmentsTable.id, req.params.id));
  res.status(204).end();
});

router.post("/:id/submit", requireRole("student"), async (req: AuthRequest, res) => {
  const user = req.currentUser!;
  const { fileUrl, fileName, remarks } = req.body;

  const [assignment] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, req.params.id));

  if (!assignment) { res.status(404).json({ error: "Assignment not found" }); return; }

  if (assignment.dueDate && new Date() > assignment.dueDate) {
    res.status(400).json({ error: "Deadline passed" }); return;
  }

  const existing = await db
    .select()
    .from(submissionsTable)
    .where(
      and(
        eq(submissionsTable.assignmentId, req.params.id),
        eq(submissionsTable.studentId, user.id)
      )
    );

  if (existing.length > 0) {
    const [updated] = await db
      .update(submissionsTable)
      .set({ fileUrl, fileName, remarks, status: "submitted" })
      .where(eq(submissionsTable.id, existing[0].id))
      .returning();
    res.json(updated);
  } else {
    const [sub] = await db
      .insert(submissionsTable)
      .values({
        id: generateId(),
        assignmentId: req.params.id,
        studentId: user.id,
        studentUsn: user.usn,
        studentName: user.name,
        fileUrl,
        fileName,
        remarks,
        status: "submitted",
      })
      .returning();
    res.status(201).json(sub);
  }
});

router.post("/:id/submissions/:subId/grade", requireRole("faculty", "admin"), async (req: AuthRequest, res) => {
  const user = req.currentUser!;
  const { marksAwarded, remarks } = req.body;

  const [assignment] = await db
    .select()
    .from(assignmentsTable)
    .where(eq(assignmentsTable.id, req.params.id));

  if (!assignment) { res.status(404).json({ error: "Assignment not found" }); return; }
  if (user.role === "faculty" && assignment.facultyId !== user.id) {
    res.status(403).json({ error: "forbidden" }); return;
  }

  const [sub] = await db
    .update(submissionsTable)
    .set({ marksAwarded, remarks, status: "graded", gradedAt: new Date() })
    .where(eq(submissionsTable.id, req.params.subId))
    .returning();

  if (!sub) { res.status(404).json({ error: "Submission not found" }); return; }
  res.json(sub);
});

export default router;
