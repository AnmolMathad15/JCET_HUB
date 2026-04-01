import { pgTable, text, varchar, date, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const eventsTable = pgTable("events", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  type: varchar("type", { length: 30 }).notNull().default("technical"),
  venue: varchar("venue", { length: 100 }),
  posterUrl: text("poster_url"),
  capacity: integer("capacity"),
  deadline: timestamp("deadline"),
  organizerId: text("organizer_id"),
  organizerName: text("organizer_name"),
  xpReward: integer("xp_reward").default(50).notNull(),
  status: varchar("status", { length: 20 }).default("upcoming").notNull(),
  registrationOpen: boolean("registration_open").default(true).notNull(),
  tags: text("tags"),
  domain: varchar("domain", { length: 30 }),
  registrationFee: integer("registration_fee").default(0).notNull(),
  requiresPayment: boolean("requires_payment").default(false).notNull(),
  isTeamEvent: boolean("is_team_event").default(false).notNull(),
  maxTeamSize: integer("max_team_size"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertEventSchema = createInsertSchema(eventsTable);
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
