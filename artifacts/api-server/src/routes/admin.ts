import { Router } from "express";
import { db } from "@workspace/db";
import {
  usersTable, departmentsTable, batchesTable, subjectsTable,
  facultySubjectAssignmentsTable,
} from "@workspace/db/schema";
import { eq, like, and, sql, or, type SQL } from "drizzle-orm";
import { requireAuth, requireRole, type AuthRequest } from "../middlewares/auth";
import crypto from "crypto";

const router = Router();

router.use(requireAuth);
router.use(requireRole("admin", "faculty"));

function generateId() {
  return crypto.randomBytes(8).toString("hex");
}

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

router.get("/departments", async (req, res) => {
  const rows = await db.select().from(departmentsTable);
  res.json(rows);
});

router.post("/departments", requireRole("admin"), async (req: AuthRequest, res) => {
  const { name, code, hodName } = req.body as { name: string; code: string; hodName?: string };
  if (!name || !code) { res.status(400).json({ error: "name and code required" }); return; }
  const [dept] = await db
    .insert(departmentsTable)
    .values({ id: generateId(), name, code: code.toUpperCase(), hodName })
    .returning();
  res.status(201).json(dept);
});

router.put("/departments/:id", requireRole("admin"), async (req, res) => {
  const id = req.params.id as string;
  const { name, code, hodName } = req.body;
  const [dept] = await db
    .update(departmentsTable)
    .set({ name, code: code?.toUpperCase(), hodName })
    .where(eq(departmentsTable.id, id))
    .returning();
  if (!dept) { res.status(404).json({ error: "not found" }); return; }
  res.json(dept);
});

router.delete("/departments/:id", requireRole("admin"), async (req, res) => {
  await db.delete(departmentsTable).where(eq(departmentsTable.id, req.params.id as string));
  res.status(204).end();
});

router.get("/batches", async (req, res) => {
  const { departmentId } = req.query;
  const rows = departmentId
    ? await db.select().from(batchesTable).where(eq(batchesTable.departmentId, departmentId as string))
    : await db.select().from(batchesTable);
  res.json(rows);
});

router.post("/batches", requireRole("admin"), async (req, res) => {
  const { name, departmentId, semester, year } = req.body;
  if (!name) { res.status(400).json({ error: "name required" }); return; }
  const [batch] = await db
    .insert(batchesTable)
    .values({ id: generateId(), name, departmentId, semester, year })
    .returning();
  res.status(201).json(batch);
});

router.put("/batches/:id", requireRole("admin"), async (req, res) => {
  const id = req.params.id as string;
  const { name, departmentId, semester, year } = req.body;
  const [batch] = await db
    .update(batchesTable)
    .set({ name, departmentId, semester, year })
    .where(eq(batchesTable.id, id))
    .returning();
  if (!batch) { res.status(404).json({ error: "not found" }); return; }
  res.json(batch);
});

router.delete("/batches/:id", requireRole("admin"), async (req, res) => {
  await db.delete(batchesTable).where(eq(batchesTable.id, req.params.id as string));
  res.status(204).end();
});

router.get("/subjects", async (req, res) => {
  const { departmentId, semester } = req.query;
  const conditions: SQL<unknown>[] = [];
  if (departmentId) conditions.push(eq(subjectsTable.departmentId, departmentId as string));
  if (semester) conditions.push(eq(subjectsTable.semester, semester as string));
  const rows = conditions.length
    ? await db.select().from(subjectsTable).where(and(...conditions))
    : await db.select().from(subjectsTable);
  res.json(rows);
});

router.post("/subjects", requireRole("admin"), async (req, res) => {
  const { name, code, departmentId, semester, credits } = req.body;
  if (!name || !code) { res.status(400).json({ error: "name and code required" }); return; }
  const [subject] = await db
    .insert(subjectsTable)
    .values({ id: generateId(), name, code: code.toUpperCase(), departmentId, semester, credits: credits ?? 4 })
    .returning();
  res.status(201).json(subject);
});

router.put("/subjects/:id", requireRole("admin"), async (req, res) => {
  const id = req.params.id as string;
  const { name, code, departmentId, semester, credits } = req.body;
  const [subject] = await db
    .update(subjectsTable)
    .set({ name, code: code?.toUpperCase(), departmentId, semester, credits })
    .where(eq(subjectsTable.id, id))
    .returning();
  if (!subject) { res.status(404).json({ error: "not found" }); return; }
  res.json(subject);
});

router.delete("/subjects/:id", requireRole("admin"), async (req, res) => {
  await db.delete(subjectsTable).where(eq(subjectsTable.id, req.params.id as string));
  res.status(204).end();
});

router.get("/users", async (req: AuthRequest, res) => {
  const { role, departmentId, batchId, search, page = "1", limit = "20" } = req.query;
  const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

  const conditions: (SQL<unknown> | undefined)[] = [];
  if (role) conditions.push(eq(usersTable.role, role as string));
  if (departmentId) conditions.push(eq(usersTable.departmentId, departmentId as string));
  if (batchId) conditions.push(eq(usersTable.batchId, batchId as string));
  if (search) {
    const s = `%${search}%`;
    conditions.push(or(like(usersTable.name, s), like(usersTable.usn, s), like(usersTable.email, s)));
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(conditions.length ? and(...conditions) : undefined);

  const rows = await db
    .select({
      id: usersTable.id,
      usn: usersTable.usn,
      name: usersTable.name,
      role: usersTable.role,
      branch: usersTable.branch,
      semester: usersTable.semester,
      email: usersTable.email,
      phone: usersTable.phone,
      departmentId: usersTable.departmentId,
      batchId: usersTable.batchId,
      admissionType: usersTable.admissionType,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(parseInt(limit as string))
    .offset(offset);

  res.json({ users: rows, total: count, page: parseInt(page as string), limit: parseInt(limit as string) });
});

router.post("/users", requireRole("admin"), async (req, res) => {
  const { usn, name, role, password, branch, semester, email, phone, departmentId, batchId, admissionType } = req.body;
  if (!usn || !name || !password || !role) {
    res.status(400).json({ error: "usn, name, role, password required" }); return;
  }
  const [user] = await db
    .insert(usersTable)
    .values({
      id: generateId(),
      usn: usn.toUpperCase(),
      name,
      role,
      passwordHash: hashPassword(password),
      branch,
      semester,
      email,
      phone,
      departmentId,
      batchId,
      admissionType: admissionType ?? "KCET",
    })
    .returning({ id: usersTable.id, usn: usersTable.usn, name: usersTable.name, role: usersTable.role });
  res.status(201).json(user);
});

router.put("/users/:id", requireRole("admin"), async (req, res) => {
  const id = req.params.id as string;
  const { name, role, branch, semester, email, phone, departmentId, batchId, admissionType, password } = req.body;
  const updates: Record<string, any> = { name, role, branch, semester, email, phone, departmentId, batchId, admissionType };
  if (password) updates.passwordHash = hashPassword(password);

  const [user] = await db
    .update(usersTable)
    .set(updates)
    .where(eq(usersTable.id, id))
    .returning({ id: usersTable.id, usn: usersTable.usn, name: usersTable.name, role: usersTable.role });
  if (!user) { res.status(404).json({ error: "not found" }); return; }
  res.json(user);
});

router.delete("/users/:id", requireRole("admin"), async (req: AuthRequest, res) => {
  const id = req.params.id as string;
  if (id === req.currentUser?.id) {
    res.status(400).json({ error: "Cannot delete yourself" }); return;
  }
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.status(204).end();
});

router.get("/faculty-assignments", async (req, res) => {
  const { facultyId } = req.query;
  const rows = facultyId
    ? await db.select().from(facultySubjectAssignmentsTable).where(eq(facultySubjectAssignmentsTable.facultyId, facultyId as string))
    : await db.select().from(facultySubjectAssignmentsTable);
  res.json(rows);
});

router.post("/faculty-assignments", requireRole("admin"), async (req, res) => {
  const { facultyId, subjectId, batchId } = req.body;
  if (!facultyId || !subjectId || !batchId) {
    res.status(400).json({ error: "facultyId, subjectId, batchId required" }); return;
  }
  const [row] = await db
    .insert(facultySubjectAssignmentsTable)
    .values({ id: generateId(), facultyId, subjectId, batchId })
    .returning();
  res.status(201).json(row);
});

router.delete("/faculty-assignments/:id", requireRole("admin"), async (req, res) => {
  await db.delete(facultySubjectAssignmentsTable).where(eq(facultySubjectAssignmentsTable.id, req.params.id as string));
  res.status(204).end();
});

router.get("/stats", requireRole("admin"), async (req, res) => {
  const [{ students }] = await db
    .select({ students: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.role, "student"));

  const [{ faculty }] = await db
    .select({ faculty: sql<number>`count(*)::int` })
    .from(usersTable)
    .where(eq(usersTable.role, "faculty"));

  const [{ departments }] = await db
    .select({ departments: sql<number>`count(*)::int` })
    .from(departmentsTable);

  const [{ subjects }] = await db
    .select({ subjects: sql<number>`count(*)::int` })
    .from(subjectsTable);

  const [{ batches }] = await db
    .select({ batches: sql<number>`count(*)::int` })
    .from(batchesTable);

  res.json({ students, faculty, departments, subjects, batches });
});

export default router;
