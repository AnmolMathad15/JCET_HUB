import { pgTable, text, integer, varchar, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const attendanceTable = pgTable("attendance", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  subject: text("subject").notNull(),
  subjectCode: varchar("subject_code", { length: 20 }).notNull(),
  attended: integer("attended").notNull().default(0),
  total: integer("total").notNull().default(0),
  percentage: real("percentage").notNull().default(0),
  status: varchar("status", { length: 10 }).notNull().default("safe"),
});

export const insertAttendanceSchema = createInsertSchema(attendanceTable);
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Attendance = typeof attendanceTable.$inferSelect;
