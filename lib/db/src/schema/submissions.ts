import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const submissionsTable = pgTable("submissions", {
  id: text("id").primaryKey(),
  assignmentId: text("assignment_id").notNull(),
  studentId: text("student_id").notNull(),
  studentUsn: text("student_usn"),
  studentName: text("student_name"),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  remarks: text("remarks"),
  marksAwarded: integer("marks_awarded"),
  status: text("status").default("submitted"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  gradedAt: timestamp("graded_at"),
});

export const insertSubmissionSchema = createInsertSchema(submissionsTable).omit({ submittedAt: true, gradedAt: true });
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type Submission = typeof submissionsTable.$inferSelect;
