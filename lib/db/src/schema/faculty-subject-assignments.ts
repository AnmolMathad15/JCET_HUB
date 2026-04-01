import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const facultySubjectAssignmentsTable = pgTable("faculty_subject_assignments", {
  id: text("id").primaryKey(),
  facultyId: text("faculty_id").notNull(),
  subjectId: text("subject_id").notNull(),
  batchId: text("batch_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertFacultySubjectAssignmentSchema = createInsertSchema(facultySubjectAssignmentsTable).omit({ createdAt: true });
export type InsertFacultySubjectAssignment = z.infer<typeof insertFacultySubjectAssignmentSchema>;
export type FacultySubjectAssignment = typeof facultySubjectAssignmentsTable.$inferSelect;
