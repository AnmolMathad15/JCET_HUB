import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { sessionsTable, usersTable } from "@workspace/db/schema";
import { eq, gt } from "drizzle-orm";

export interface AuthRequest extends Request {
  currentUser?: {
    id: string;
    usn: string;
    name: string;
    role: string;
    branch?: string | null;
    semester?: string | null;
    departmentId?: string | null;
    batchId?: string | null;
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const headerUserId = req.headers["x-user-id"] as string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const [session] = await db
        .select()
        .from(sessionsTable)
        .where(eq(sessionsTable.token, token));

      if (!session || session.expiresAt < new Date()) {
        res.status(401).json({ error: "unauthorized", message: "Session expired or invalid" });
        return;
      }

      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, session.userId));

      if (!user) {
        res.status(401).json({ error: "unauthorized", message: "User not found" });
        return;
      }

      req.currentUser = {
        id: user.id,
        usn: user.usn,
        name: user.name,
        role: user.role,
        branch: user.branch,
        semester: user.semester,
        departmentId: user.departmentId,
        batchId: user.batchId,
      };
      return next();
    } catch {
      res.status(401).json({ error: "unauthorized", message: "Invalid token" });
      return;
    }
  }

  if (headerUserId) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, headerUserId));

    if (user) {
      req.currentUser = {
        id: user.id,
        usn: user.usn,
        name: user.name,
        role: user.role,
        branch: user.branch,
        semester: user.semester,
        departmentId: user.departmentId,
        batchId: user.batchId,
      };
      return next();
    }
  }

  res.status(401).json({ error: "unauthorized", message: "Authentication required" });
}

/** Like requireAuth but never rejects — attaches currentUser if valid token present */
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const headerUserId = req.headers["x-user-id"] as string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    try {
      const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
      if (session && session.expiresAt >= new Date()) {
        const [user] = await db.select().from(usersTable).where(eq(usersTable.id, session.userId));
        if (user) {
          req.currentUser = {
            id: user.id, usn: user.usn, name: user.name, role: user.role,
            branch: user.branch, semester: user.semester,
            departmentId: user.departmentId, batchId: user.batchId,
          };
        }
      }
    } catch {}
  } else if (headerUserId) {
    try {
      const [user] = await db.select().from(usersTable).where(eq(usersTable.id, headerUserId));
      if (user) {
        req.currentUser = {
          id: user.id, usn: user.usn, name: user.name, role: user.role,
          branch: user.branch, semester: user.semester,
          departmentId: user.departmentId, batchId: user.batchId,
        };
      }
    } catch {}
  }

  next();
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.currentUser) {
      res.status(401).json({ error: "unauthorized", message: "Authentication required" });
      return;
    }
    if (!roles.includes(req.currentUser.role)) {
      res.status(403).json({ error: "forbidden", message: "Insufficient permissions" });
      return;
    }
    next();
  };
}
