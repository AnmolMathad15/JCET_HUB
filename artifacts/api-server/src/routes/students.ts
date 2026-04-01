import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/students/me", async (req, res) => {
  try {
    const usn = req.headers["x-user-usn"] as string ?? "4JC21CS001";

    const [user] = await db.select().from(usersTable).where(eq(usersTable.usn, usn));

    if (!user) {
      res.status(404).json({ error: "not_found", message: "Student not found" });
      return;
    }

    const nameParts = user.name.split(" ");
    const avatarInitials = nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : user.name.substring(0, 2).toUpperCase();

    res.json({
      id: user.id,
      usn: user.usn,
      name: user.name,
      branch: user.branch ?? "CSE",
      semester: user.semester ?? "5",
      role: user.role,
      email: user.email ?? "",
      phone: user.phone ?? "",
      avatarInitials,
    });
  } catch (err) {
    req.log.error({ err }, "Get student profile error");
    res.status(500).json({ error: "server_error", message: "Internal server error" });
  }
});

export default router;
