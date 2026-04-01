import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";

export const badgeDefinitionsTable = pgTable("badge_definitions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon").default("🏅"),
  category: varchar("category", { length: 30 }).default("participation"),
  minEvents: integer("min_events").default(1),
  color: varchar("color", { length: 20 }).default("amber"),
});

export const studentBadgesTable = pgTable("student_badges", {
  id: text("id").primaryKey(),
  studentId: text("student_id").notNull(),
  badgeId: text("badge_id").notNull(),
  awardedAt: timestamp("awarded_at").defaultNow(),
  eventId: text("event_id"),
  awardedBy: text("awarded_by"),
});

export type BadgeDefinition = typeof badgeDefinitionsTable.$inferSelect;
export type StudentBadge = typeof studentBadgesTable.$inferSelect;
