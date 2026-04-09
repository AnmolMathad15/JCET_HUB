import { pgTable, text, varchar } from "drizzle-orm/pg-core";

export const attendanceRecordsTable = pgTable("attendance_records", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  studentId: text("student_id").notNull(),
  studentUsn: varchar("student_usn", { length: 20 }),
  status: varchar("status", { length: 10 }).notNull().default("absent"),
});

export type AttendanceRecord = typeof attendanceRecordsTable.$inferSelect;
