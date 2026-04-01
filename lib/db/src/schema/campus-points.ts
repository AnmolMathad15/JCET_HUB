import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const campusPointsTable = pgTable("campus_points", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  eventId: text("event_id"),
  awardedAt: timestamp("awarded_at").defaultNow(),
  awardedBy: text("awarded_by"),
  category: varchar("category", { length: 30 }).default("participation"),
});

export type CampusPoint = typeof campusPointsTable.$inferSelect;
