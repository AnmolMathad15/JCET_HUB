import { Router } from "express";
import { db } from "@workspace/db";
import {
  eventsTable, eventRegistrationsTable, campusPointsTable,
  studentBadgesTable, badgeDefinitionsTable, usersTable
} from "@workspace/db/schema";
import { eq, desc, asc, sql, and, inArray } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import { randomUUID } from "crypto";
import { broadcastEventRegistration, broadcastAttendanceUpdate } from "../socket";

const router = Router();

const DEFAULT_BADGES = [
  { id: "badge-first-event",     name: "First Step",       icon: "🎯", description: "Attended your first event", category: "participation", minEvents: 1,  color: "amber" },
  { id: "badge-5-events",        name: "Active Participant",icon: "⭐", description: "Attended 5 events",        category: "participation", minEvents: 5,  color: "blue" },
  { id: "badge-10-events",       name: "Campus Champion",   icon: "🏆", description: "Attended 10 events",       category: "participation", minEvents: 10, color: "gold" },
  { id: "badge-hackathon",       name: "Hackathon Hero",    icon: "💻", description: "Participated in a hackathon", category: "technical",  minEvents: 1,  color: "purple" },
  { id: "badge-cultural",        name: "Cultural Star",     icon: "🎭", description: "Participated in cultural events", category: "cultural", minEvents: 1, color: "pink" },
  { id: "badge-sports",          name: "Sports Champion",   icon: "🏅", description: "Participated in sports",   category: "sports",       minEvents: 1,  color: "green" },
  { id: "badge-volunteer",       name: "Campus Volunteer",  icon: "🤝", description: "Volunteered at an event",  category: "volunteer",    minEvents: 1,  color: "teal" },
];

async function ensureBadges() {
  const existing = await db.select({ id: badgeDefinitionsTable.id }).from(badgeDefinitionsTable);
  const existingIds = new Set(existing.map(b => b.id));
  const toInsert = DEFAULT_BADGES.filter(b => !existingIds.has(b.id));
  if (toInsert.length > 0) {
    await db.insert(badgeDefinitionsTable).values(toInsert);
  }
}

async function awardPointsAndBadges(studentId: string, eventId: string, points: number, reason: string, eventType: string) {
  await db.insert(campusPointsTable).values({
    id: randomUUID(), studentId, points, reason, eventId,
    category: "participation", awardedAt: new Date(),
  });

  const totalAttended = await db.select({ count: sql<number>`count(*)` })
    .from(eventRegistrationsTable)
    .where(and(eq(eventRegistrationsTable.studentId, studentId), eq(eventRegistrationsTable.attended, true)));
  const count = Number(totalAttended[0]?.count ?? 0);

  const existingBadges = await db.select({ badgeId: studentBadgesTable.badgeId })
    .from(studentBadgesTable).where(eq(studentBadgesTable.studentId, studentId));
  const hasBadge = new Set(existingBadges.map(b => b.badgeId));

  const toAward: string[] = [];
  if (count >= 1 && !hasBadge.has("badge-first-event")) toAward.push("badge-first-event");
  if (count >= 5 && !hasBadge.has("badge-5-events")) toAward.push("badge-5-events");
  if (count >= 10 && !hasBadge.has("badge-10-events")) toAward.push("badge-10-events");
  if ((eventType === "technical" || eventType === "hackathon") && !hasBadge.has("badge-hackathon")) toAward.push("badge-hackathon");
  if (eventType === "cultural" && !hasBadge.has("badge-cultural")) toAward.push("badge-cultural");
  if (eventType === "sports" && !hasBadge.has("badge-sports")) toAward.push("badge-sports");

  for (const badgeId of toAward) {
    await db.insert(studentBadgesTable).values({ id: randomUUID(), studentId, badgeId, eventId, awardedAt: new Date() });
    await db.insert(campusPointsTable).values({
      id: randomUUID(), studentId, points: 25, reason: `Badge earned: ${badgeId}`, eventId,
      category: "badge", awardedAt: new Date(),
    });
  }
}

router.get("/events-hub", requireAuth, async (req, res) => {
  try {
    const events = await db.select().from(eventsTable).orderBy(desc(eventsTable.createdAt));
    const userId = (req as any).currentUser?.id;
    if (!userId) { res.json(events); return; }

    const myRegs = await db.select({ eventId: eventRegistrationsTable.eventId, attended: eventRegistrationsTable.attended })
      .from(eventRegistrationsTable)
      .where(eq(eventRegistrationsTable.studentId, userId));
    const regMap = Object.fromEntries(myRegs.map(r => [r.eventId, r]));

    const countRows = await db.select({
      eventId: eventRegistrationsTable.eventId,
      count: sql<number>`count(*)`,
    }).from(eventRegistrationsTable).groupBy(eventRegistrationsTable.eventId);
    const countMap = Object.fromEntries(countRows.map(r => [r.eventId, Number(r.count)]));

    res.json(events.map(e => ({
      ...e,
      isRegistered: !!regMap[e.id],
      attended: regMap[e.id]?.attended ?? false,
      registrationCount: countMap[e.id] ?? 0,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

router.post("/events-hub", requireAuth, async (req, res) => {
  try {
    const user = (req as any).currentUser;
    if (!user || (user.role !== "faculty" && user.role !== "admin")) {
      res.status(403).json({ error: "Faculty/Admin only" }); return;
    }
    const { title, description, date, type, venue, posterUrl, capacity, deadline, xpReward, tags, domain, registrationFee, requiresPayment, isTeamEvent, maxTeamSize } = req.body;
    if (!title || !date) { res.status(400).json({ error: "Title and date required" }); return; }
    await ensureBadges();
    const event = await db.insert(eventsTable).values({
      id: randomUUID(), title, description, date, type: type ?? "technical",
      venue, posterUrl, capacity: capacity ? Number(capacity) : null,
      deadline: deadline ? new Date(deadline) : null,
      organizerId: user.id, organizerName: user.name,
      xpReward: xpReward ? Number(xpReward) : 50,
      status: "upcoming", registrationOpen: true, tags, domain,
      registrationFee: registrationFee ? Number(registrationFee) : 0,
      requiresPayment: !!requiresPayment,
      isTeamEvent: !!isTeamEvent,
      maxTeamSize: maxTeamSize ? Number(maxTeamSize) : null,
    }).returning();
    res.json(event[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create event" });
  }
});

router.put("/events-hub/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).currentUser;
    if (!user || (user.role !== "faculty" && user.role !== "admin")) {
      res.status(403).json({ error: "Faculty/Admin only" }); return;
    }
    const id = req.params.id as string;
    const { title, description, date, type, venue, posterUrl, capacity, deadline, xpReward, tags, domain, status, registrationOpen, registrationFee, requiresPayment, isTeamEvent, maxTeamSize } = req.body;
    const updated = await db.update(eventsTable).set({
      title, description, date, type, venue, posterUrl,
      capacity: capacity != null ? Number(capacity) : undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      xpReward: xpReward != null ? Number(xpReward) : undefined,
      tags, domain, status, registrationOpen,
      registrationFee: registrationFee != null ? Number(registrationFee) : undefined,
      requiresPayment: requiresPayment != null ? !!requiresPayment : undefined,
      isTeamEvent: isTeamEvent != null ? !!isTeamEvent : undefined,
      maxTeamSize: maxTeamSize != null ? Number(maxTeamSize) : undefined,
    }).where(eq(eventsTable.id, id)).returning();
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: "Failed to update event" });
  }
});

router.delete("/events-hub/:id", requireAuth, async (req, res) => {
  try {
    const user = (req as any).currentUser;
    if (!user || user.role !== "admin") { res.status(403).json({ error: "Admin only" }); return; }
    await db.delete(eventsTable).where(eq(eventsTable.id, req.params.id as string));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete event" });
  }
});

router.post("/events-hub/:id/register", requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const user = (req as any).currentUser;
    if (!user) { res.status(401).json({ error: "Auth required" }); return; }

    const event = await db.select().from(eventsTable).where(eq(eventsTable.id, id)).limit(1);
    if (!event.length) { res.status(404).json({ error: "Event not found" }); return; }
    if (!event[0].registrationOpen) { res.status(400).json({ error: "Registration closed" }); return; }

    const existing = await db.select().from(eventRegistrationsTable)
      .where(and(eq(eventRegistrationsTable.eventId, id), eq(eventRegistrationsTable.studentId, user.id)))
      .limit(1);
    if (existing.length) { res.status(400).json({ error: "Already registered" }); return; }

    if (event[0].capacity) {
      const count = await db.select({ c: sql<number>`count(*)` }).from(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, id));
      if (Number(count[0].c) >= event[0].capacity) { res.status(400).json({ error: "Event is full" }); return; }
    }

    const {
      email, phone, branch, semester, yearOfStudy,
      teamName, teamMembers,
      paymentMode, transactionId, paymentScreenshotUrl, additionalInfo,
    } = req.body;

    const paymentStatus = event[0].requiresPayment
      ? (transactionId ? "submitted" : "pending")
      : "not_required";

    const reg = await db.insert(eventRegistrationsTable).values({
      id: randomUUID(), eventId: id, studentId: user.id,
      studentName: user.name, studentUsn: user.usn,
      email, phone, branch, semester, yearOfStudy,
      teamName, teamMembers: teamMembers ? JSON.stringify(teamMembers) : null,
      paymentMode, transactionId,
      paymentAmount: event[0].registrationFee,
      paymentScreenshotUrl,
      paymentStatus,
      additionalInfo,
      qrToken: randomUUID(), status: "registered", registeredAt: new Date(),
    }).returning();

    const newCount = await db.select({ c: sql<number>`count(*)` }).from(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, id));
    broadcastEventRegistration(id, Number(newCount[0].c), 1);

    res.json(reg[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to register" });
  }
});

router.delete("/events-hub/:id/register", requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const user = (req as any).currentUser;
    await db.delete(eventRegistrationsTable)
      .where(and(eq(eventRegistrationsTable.eventId, id), eq(eventRegistrationsTable.studentId, user.id)));
    const newCount = await db.select({ c: sql<number>`count(*)` }).from(eventRegistrationsTable).where(eq(eventRegistrationsTable.eventId, id));
    broadcastEventRegistration(id, Number(newCount[0].c), -1);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to unregister" });
  }
});

router.get("/events-hub/:id/registrations", requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const user = (req as any).currentUser;
    if (!user || (user.role !== "faculty" && user.role !== "admin")) {
      res.status(403).json({ error: "Faculty/Admin only" }); return;
    }
    const regs = await db.select().from(eventRegistrationsTable)
      .where(eq(eventRegistrationsTable.eventId, id))
      .orderBy(asc(eventRegistrationsTable.registeredAt));
    res.json(regs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

router.post("/events-hub/:id/attendance/:regId", requireAuth, async (req, res) => {
  try {
    const id = req.params.id as string;
    const regId = req.params.regId as string;
    const user = (req as any).currentUser;
    if (!user || (user.role !== "faculty" && user.role !== "admin")) {
      res.status(403).json({ error: "Faculty/Admin only" }); return;
    }
    const reg = await db.select().from(eventRegistrationsTable).where(eq(eventRegistrationsTable.id, regId)).limit(1);
    if (!reg.length) { res.status(404).json({ error: "Registration not found" }); return; }
    if (reg[0].attended) { res.status(400).json({ error: "Already marked attended" }); return; }

    await db.update(eventRegistrationsTable).set({ attended: true, attendedAt: new Date(), status: "attended" })
      .where(eq(eventRegistrationsTable.id, regId));

    const event = await db.select().from(eventsTable).where(eq(eventsTable.id, id)).limit(1);
    if (event.length) {
      await awardPointsAndBadges(reg[0].studentId, event[0].id, event[0].xpReward, `Attended: ${event[0].title}`, event[0].type);
      broadcastAttendanceUpdate(id, reg[0].studentId, event[0].xpReward);
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to mark attendance" });
  }
});

router.get("/leaderboard", requireAuth, async (req, res) => {
  try {
    const rows = await db.select({
      studentId: campusPointsTable.studentId,
      totalPoints: sql<number>`sum(${campusPointsTable.points})`,
    }).from(campusPointsTable).groupBy(campusPointsTable.studentId)
      .orderBy(desc(sql`sum(${campusPointsTable.points})`)).limit(50);

    if (!rows.length) { res.json([]); return; }

    const userIds = rows.map(r => r.studentId);
    const users = await db.select({ id: usersTable.id, name: usersTable.name, usn: usersTable.usn, branch: usersTable.branch, departmentId: usersTable.departmentId })
      .from(usersTable).where(inArray(usersTable.id, userIds));
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const badgeCounts = await db.select({
      studentId: studentBadgesTable.studentId,
      count: sql<number>`count(*)`,
    }).from(studentBadgesTable).groupBy(studentBadgesTable.studentId);
    const badgeMap = Object.fromEntries(badgeCounts.map(b => [b.studentId, Number(b.count)]));

    const eventCounts = await db.select({
      studentId: eventRegistrationsTable.studentId,
      count: sql<number>`count(*)`,
    }).from(eventRegistrationsTable)
      .where(eq(eventRegistrationsTable.attended, true))
      .groupBy(eventRegistrationsTable.studentId);
    const eventCountMap = Object.fromEntries(eventCounts.map(e => [e.studentId, Number(e.count)]));

    res.json(rows.map((r, i) => ({
      rank: i + 1,
      studentId: r.studentId,
      name: userMap[r.studentId]?.name ?? "Unknown",
      usn: userMap[r.studentId]?.usn ?? "—",
      branch: userMap[r.studentId]?.branch ?? "—",
      totalPoints: Number(r.totalPoints),
      badgeCount: badgeMap[r.studentId] ?? 0,
      eventsAttended: eventCountMap[r.studentId] ?? 0,
      level: getLevel(Number(r.totalPoints)),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

async function achievementsHandler(req: any, res: any) {
  try {
    const user = req.currentUser;
    const targetId = req.params.studentId ?? user?.id;
    if (!targetId) { res.status(400).json({ error: "Student ID required" }); return; }

    const [points, badges, registrations] = await Promise.all([
      db.select().from(campusPointsTable).where(eq(campusPointsTable.studentId, targetId)).orderBy(desc(campusPointsTable.awardedAt)),
      db.select({ sb: studentBadgesTable, bd: badgeDefinitionsTable })
        .from(studentBadgesTable)
        .leftJoin(badgeDefinitionsTable, eq(studentBadgesTable.badgeId, badgeDefinitionsTable.id))
        .where(eq(studentBadgesTable.studentId, targetId)),
      db.select({ reg: eventRegistrationsTable, ev: eventsTable })
        .from(eventRegistrationsTable)
        .leftJoin(eventsTable, eq(eventRegistrationsTable.eventId, eventsTable.id))
        .where(and(eq(eventRegistrationsTable.studentId, targetId), eq(eventRegistrationsTable.attended, true)))
        .orderBy(desc(eventRegistrationsTable.attendedAt)),
    ]);

    const totalPoints = points.reduce((s, p) => s + p.points, 0);
    const studentInfo = await db.select().from(usersTable).where(eq(usersTable.id, targetId)).limit(1);

    res.json({
      student: studentInfo[0] ?? null,
      totalPoints,
      level: getLevel(totalPoints),
      nextLevel: getNextLevel(totalPoints),
      badges: badges.map(b => ({ ...b.sb, definition: b.bd })),
      recentPoints: points.slice(0, 20),
      eventsAttended: registrations.map(r => ({ ...r.reg, event: r.ev })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch achievements" });
  }
}

router.get("/achievements", requireAuth, achievementsHandler);
router.get("/achievements/:studentId", requireAuth, achievementsHandler);

router.get("/resume-data", requireAuth, async (req, res) => {
  try {
    const user = (req as any).currentUser;
    if (!user) { res.status(401).json({ error: "Auth required" }); return; }

    const [registrations, badgeData, points, userInfo] = await Promise.all([
      db.select({ reg: eventRegistrationsTable, ev: eventsTable })
        .from(eventRegistrationsTable)
        .leftJoin(eventsTable, eq(eventRegistrationsTable.eventId, eventsTable.id))
        .where(and(eq(eventRegistrationsTable.studentId, user.id), eq(eventRegistrationsTable.attended, true)))
        .orderBy(desc(eventRegistrationsTable.attendedAt)),
      db.select({ sb: studentBadgesTable, bd: badgeDefinitionsTable })
        .from(studentBadgesTable)
        .leftJoin(badgeDefinitionsTable, eq(studentBadgesTable.badgeId, badgeDefinitionsTable.id))
        .where(eq(studentBadgesTable.studentId, user.id)),
      db.select({ total: sql<number>`sum(${campusPointsTable.points})` })
        .from(campusPointsTable).where(eq(campusPointsTable.studentId, user.id)),
      db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1),
    ]);

    const totalPoints = Number(points[0]?.total ?? 0);
    const typeGroups: Record<string, string[]> = {};
    const roles: string[] = [];
    for (const { ev, reg } of registrations) {
      if (!ev) continue;
      const t = ev.type ?? "other";
      if (!typeGroups[t]) typeGroups[t] = [];
      typeGroups[t].push(ev.title);
    }

    const skillMap: Record<string, string[]> = {
      technical: ["Problem Solving", "Programming", "Technical Analysis"],
      hackathon: ["Rapid Prototyping", "Teamwork", "Innovation"],
      cultural: ["Communication", "Creativity", "Leadership"],
      sports: ["Team Collaboration", "Physical Fitness", "Discipline"],
      workshop: ["Continuous Learning", "Domain Knowledge"],
      academic: ["Research", "Critical Thinking", "Academic Writing"],
    };
    const skills = new Set<string>();
    for (const type of Object.keys(typeGroups)) {
      (skillMap[type] ?? []).forEach(s => skills.add(s));
    }

    res.json({
      student: userInfo[0] ?? null,
      totalPoints,
      level: getLevel(totalPoints),
      eventsAttended: registrations.map(r => ({ ...r.reg, event: r.ev })),
      badges: badgeData.map(b => ({ ...b.sb, definition: b.bd })),
      skills: Array.from(skills),
      typeGroups,
      summary: `Active campus participant with ${registrations.length} verified events attended. Earned ${badgeData.length} achievement badges and ${totalPoints} campus XP.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to generate resume data" });
  }
});

function getLevel(points: number) {
  if (points >= 1000) return { name: "Elite", icon: "💎", color: "text-purple-600", min: 1000 };
  if (points >= 500)  return { name: "Pro",   icon: "🏆", color: "text-amber-600",  min: 500 };
  if (points >= 200)  return { name: "Rising", icon: "⭐", color: "text-blue-600",  min: 200 };
  if (points >= 50)   return { name: "Active", icon: "🔥", color: "text-green-600", min: 50 };
  return { name: "Beginner", icon: "🌱", color: "text-gray-500", min: 0 };
}

function getNextLevel(points: number) {
  if (points < 50)   return { name: "Active",  icon: "🔥",  needed: 50 - points };
  if (points < 200)  return { name: "Rising",  icon: "⭐",  needed: 200 - points };
  if (points < 500)  return { name: "Pro",     icon: "🏆",  needed: 500 - points };
  if (points < 1000) return { name: "Elite",   icon: "💎",  needed: 1000 - points };
  return null;
}

export default router;
