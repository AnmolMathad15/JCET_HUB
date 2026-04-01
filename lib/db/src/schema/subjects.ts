import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const subjectsTable = pgTable("subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: varchar("code", { length: 20 }).unique().notNull(),
  departmentId: text("department_id"),
  semester: varchar("semester", { length: 5 }),
  credits: integer("credits").default(4),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertSubjectSchema = createInsertSchema(subjectsTable).omit({ createdAt: true });
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjectsTable.$inferSelect;
