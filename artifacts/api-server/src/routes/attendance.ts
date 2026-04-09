import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { attendanceTable, attendanceSessionsTable, attendanceRecordsTable, usersTable, batchesTable } from "@workspace/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { requireAuth, optionalAuth } from "../middlewares/auth";
import { randomUUID } from "crypto";

const router: IRouter = Router();

/* ── Student: own attendance ── */
router.get("/attendance/me", requireAuth, async (req, res) => {
  try {
    const user = (req as any).currentUser;
    const records = await db.select().from(attendanceTable).where(eq(attendanceTable.userId, user.id));
    res.json(records.map(r => ({
      subject: r.subject, subjectCode: r.subjectCode,
      attended: r.attended, total: r.total,
      percentage: r.percentage, status: r.status,
    })));
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

/* ── Faculty: list batches (filtered by branch/semester) ── */
router.get("/faculty/attendance/batches", requireAuth, async (req, res) => {
  try {
    const user = (req as any).currentUser;
    if (user.role !== "faculty" && user.role !== "admin") {
      res.status(403).json({ error: "Faculty/Admin only" }); return;
    }
    const { branch, semester } = req.query as Record<string, string>;
    let q = db.select().from(batchesTable);
    const batches = await q;
    let filtered = batches;
    if (branch) filtered = filtered.filter(b => (b as any).name?.toUpperCase().includes(branch.toUpperCase()) || branch === "ALL");
    if (semester) filtered = filtered.filter(b => (b as any).semester === semester);
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

/* ── Faculty: all batches with student counts ── */
router.get("/faculty/attendance/all-batches", requireAuth, async (req, res) => {
  try {
    const user = (req as any).currentUser;
    if (user.role !== "faculty" && user.role !== "admin") {
      res.status(403).json({ error: "Faculty/Admin only" }); return;
    }
    const batches = await db.select().from(batchesTable);
    const studentCounts = await db
      .select({ batchId: usersTable.batchId, count: sql<number>`count(*)` })
      .from(usersTable)
      .where(eq(usersTable.role, "student"))
      .groupBy(usersTable.batchId);
    const countMap = Object.fromEntries(studentCounts.map(r => [r.batchId ?? "", Number(r.count)]));
    res.json(batches.map(b => ({ ...b, studentCount: countMap[b.id] ?? 0 })));
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

/* ── Faculty: students in a batch with cumulative attendance ── */
router.get("/faculty/attendance/students", requireAuth, async (req, res) => {
  try {
    const user = (req as any).currentUser;
    if (user.role !== "faculty" && user.role !== "admin") {
      res.status(403).json({ error: "Faculty/Admin only" }); return;
    }
    const { batchId, subject, subjectCode } = req.query as Record<string, string>;
    if (!batchId) { res.status(400).json({ error: "batchId required" }); return; }

    const students = await db.select({
      id: usersTable.id, name: usersTable.name, usn: usersTable.usn,
      branch: usersTable.branch, semester: usersTable.semester,
    }).from(usersTable).where(and(eq(usersTable.batchId, batchId), eq(usersTable.role, "student")));

    if (!students.length) { res.json([]); return; }

    if (!subject) {
      res.json(students.map(s => ({ ...s, attended: 0, total: 0, percentage: 0, status: "safe" })));
      return;
    }

    const attRows = await db.select().from(attendanceTable)
      .where(and(
        inArray(attendanceTable.userId, students.map(s => s.id)),
        eq(attendanceTable.subject, subject),
      ));
    const attMap = Object.fromEntries(attRows.map(r => [r.userId, r]));

    res.json(students.map(s => {
      const att = attMap[s.id];
      const attended = att?.attended ?? 0;
      const total = att?.total ?? 0;
      const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
      const status = pct >= 75 ? "safe" : pct >= 65 ? "warning" : "danger";
      return { ...s, attended, total, absent: total - attended, percentage: pct, status };
    }));
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

/* ── Faculty: create session + mark attendance ── */
router.post("/faculty/attendance/session", requireAuth, async (req, res) => {
  try {
    const user = (req as any).currentUser;
    if (user.role !== "faculty" && user.role !== "admin") {
      res.status(403).json({ error: "Faculty/Admin only" }); return;
    }
    const { date, subject, subjectCode, branch, semester, batchId, records } = req.body;
    if (!date || !subject || !batchId || !records?.length) {
      res.status(400).json({ error: "date, subject, batchId, records required" }); return;
    }

    const sessionId = randomUUID();
    await db.insert(attendanceSessionsTable).values({
      id: sessionId, date, subject,
      subjectCode: subjectCode ?? "N/A",
      facultyId: user.id, facultyName: user.name,
      branch: branch ?? user.branch ?? "CSE",
      semester: semester ?? "6",
      batchId,
    });

    const recRows = (records as Array<{ studentId: string; studentUsn: string; status: "present" | "absent" }>)
      .map(r => ({ id: randomUUID(), sessionId, studentId: r.studentId, studentUsn: r.studentUsn ?? "", status: r.status }));
    await db.insert(attendanceRecordsTable).values(recRows);

    const presentIds = recRows.filter(r => r.status === "present").map(r => r.studentId);
    const allIds = recRows.map(r => r.studentId);

    for (const studentId of allIds) {
      const isPresent = presentIds.includes(studentId);
      const existing = await db.select().from(attendanceTable)
        .where(and(eq(attendanceTable.userId, studentId), eq(attendanceTable.subject, subject))).limit(1);

      if (existing.length) {
        const prev = existing[0];
        const newAttended = prev.attended + (isPresent ? 1 : 0);
        const newTotal = prev.total + 1;
        const pct = Math.round((newAttended / newTotal) * 100);
        const status = pct >= 75 ? "safe" : pct >= 65 ? "warning" : "danger";
        await db.update(attendanceTable)
          .set({ attended: newAttended, total: newTotal, percentage: pct, status })
          .where(eq(attendanceTable.id, prev.id));
      } else {
        const attended = isPresent ? 1 : 0;
        const pct = isPresent ? 100 : 0;
        await db.insert(attendanceTable).values({
          id: randomUUID(), userId: studentId, subject,
          subjectCode: subjectCode ?? "N/A",
          attended, total: 1, percentage: pct,
          status: pct >= 75 ? "safe" : "danger",
        });
      }
    }

    res.json({ success: true, sessionId, date, subject, total: allIds.length, present: presentIds.length, absent: allIds.length - presentIds.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server_error" });
  }
});

/* ── Faculty: list past sessions for a batch+subject ── */
router.get("/faculty/attendance/sessions", requireAuth, async (req, res) => {
  try {
    const user = (req as any).currentUser;
    if (user.role !== "faculty" && user.role !== "admin") {
      res.status(403).json({ error: "Faculty/Admin only" }); return;
    }
    const { batchId, subject } = req.query as Record<string, string>;
    if (!batchId || !subject) { res.status(400).json({ error: "batchId and subject required" }); return; }

    const sessions = await db.select().from(attendanceSessionsTable)
      .where(and(eq(attendanceSessionsTable.batchId, batchId), eq(attendanceSessionsTable.subject, subject)));
    sessions.sort((a, b) => (b.date > a.date ? 1 : -1));

    const enriched = await Promise.all(sessions.map(async s => {
      const recs = await db.select().from(attendanceRecordsTable).where(eq(attendanceRecordsTable.sessionId, s.id));
      return { ...s, total: recs.length, present: recs.filter(r => r.status === "present").length, absent: recs.filter(r => r.status === "absent").length };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

/* ── Faculty: semester summary per student ── */
router.get("/faculty/attendance/summary", requireAuth, async (req, res) => {
  try {
    const user = (req as any).currentUser;
    if (user.role !== "faculty" && user.role !== "admin") {
      res.status(403).json({ error: "Faculty/Admin only" }); return;
    }
    const { batchId, subject } = req.query as Record<string, string>;
    if (!batchId) { res.status(400).json({ error: "batchId required" }); return; }

    const students = await db.select({
      id: usersTable.id, name: usersTable.name, usn: usersTable.usn,
    }).from(usersTable).where(and(eq(usersTable.batchId, batchId), eq(usersTable.role, "student")));

    if (!subject) {
      // Return all-subject summary
      const attRows = subject
        ? await db.select().from(attendanceTable)
            .where(and(inArray(attendanceTable.userId, students.map(s => s.id)), eq(attendanceTable.subject, subject)))
        : await db.select().from(attendanceTable)
            .where(inArray(attendanceTable.userId, students.map(s => s.id)));

      const byStudent: Record<string, typeof attRows> = {};
      for (const r of attRows) {
        if (!byStudent[r.userId]) byStudent[r.userId] = [];
        byStudent[r.userId].push(r);
      }

      return res.json(students.map(s => {
        const rows = byStudent[s.id] ?? [];
        const totalPresent = rows.reduce((a, r) => a + r.attended, 0);
        const totalClasses = rows.reduce((a, r) => a + r.total, 0);
        const pct = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 0;
        return {
          ...s, subjects: rows.map(r => ({ subject: r.subject, subjectCode: r.subjectCode, attended: r.attended, total: r.total, absent: r.total - r.attended, percentage: r.percentage, status: r.status })),
          totalPresent, totalClasses, totalAbsent: totalClasses - totalPresent, overallPercentage: pct,
          status: pct >= 75 ? "safe" : pct >= 65 ? "warning" : "danger",
        };
      }));
    }

    const attRows = await db.select().from(attendanceTable)
      .where(and(inArray(attendanceTable.userId, students.map(s => s.id)), eq(attendanceTable.subject, subject)));
    const attMap = Object.fromEntries(attRows.map(r => [r.userId, r]));

    res.json(students.map(s => {
      const att = attMap[s.id];
      const attended = att?.attended ?? 0;
      const total = att?.total ?? 0;
      const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
      return { ...s, attended, total, absent: total - attended, percentage: pct, status: pct >= 75 ? "safe" : pct >= 65 ? "warning" : "danger" };
    }));
  } catch (err) {
    res.status(500).json({ error: "server_error" });
  }
});

export default router;
