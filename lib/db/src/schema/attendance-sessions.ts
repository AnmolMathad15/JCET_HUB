import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";

export const attendanceSessionsTable = pgTable("attendance_sessions", {
  id: text("id").primaryKey(),
  date: text("date").notNull(),
  subject: text("subject").notNull(),
  subjectCode: varchar("subject_code", { length: 20 }).notNull(),
  facultyId: text("faculty_id").notNull(),
  facultyName: text("faculty_name"),
  branch: varchar("branch", { length: 50 }).notNull(),
  semester: varchar("semester", { length: 5 }).notNull(),
  batchId: text("batch_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type AttendanceSession = typeof attendanceSessionsTable.$inferSelect;
