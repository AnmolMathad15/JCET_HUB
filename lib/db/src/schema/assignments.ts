import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assignmentsTable = pgTable("assignments", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  subjectId: text("subject_id"),
  subjectName: text("subject_name"),
  batchId: text("batch_id"),
  batchName: text("batch_name"),
  facultyId: text("faculty_id").notNull(),
  facultyName: text("faculty_name"),
  dueDate: timestamp("due_date"),
  maxMarks: integer("max_marks").default(10),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertAssignmentSchema = createInsertSchema(assignmentsTable).omit({ createdAt: true });
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type Assignment = typeof assignmentsTable.$inferSelect;
