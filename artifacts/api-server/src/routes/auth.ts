import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable, sessionsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/auth/login", async (req, res) => {
  try {
    const { usn, password } = req.body;

    if (!usn || !password) {
      res.status(400).json({ error: "bad_request", message: "USN and password are required" });
      return;
    }

    const [user] = await db.select().from(usersTable).where(eq(usersTable.usn, usn.toUpperCase()));

    if (!user) {
      res.status(401).json({ error: "unauthorized", message: "Invalid USN or password" });
      return;
    }

    const hashedInput = hashPassword(password);
    if (user.passwordHash !== hashedInput) {
      res.status(401).json({ error: "unauthorized", message: "Invalid USN or password" });
      return;
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(sessionsTable).values({ token, userId: user.id, expiresAt });

    const nameParts = user.name.split(" ");
    const avatarInitials = nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : user.name.substring(0, 2).toUpperCase();

    res.json({
      token,
      user: {
        id: user.id,
        usn: user.usn,
        name: user.name,
        branch: user.branch ?? "CSE",
        semester: user.semester ?? "5",
        role: user.role,
        email: user.email ?? "",
        phone: user.phone ?? "",
        departmentId: user.departmentId ?? "",
        batchId: user.batchId ?? "",
        admissionType: user.admissionType ?? "KCET",
        avatarInitials,
      },
    });
  } catch (err) {
    req.log.error({ err }, "Login error");
    res.status(500).json({ error: "server_error", message: "Internal server error" });
  }
});

router.post("/auth/logout", async (req, res) => {
  const authHeader = req.headers["authorization"];
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    await db.delete(sessionsTable).where(eq(sessionsTable.token, token)).catch(() => {});
  }
  res.status(204).end();
});

export default router;
