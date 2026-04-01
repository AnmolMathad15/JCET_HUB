import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const timetableTable = pgTable("timetable", {
  id: text("id").primaryKey(),
  branch: varchar("branch", { length: 50 }).notNull(),
  semester: varchar("semester", { length: 5 }).notNull(),
  day: varchar("day", { length: 15 }).notNull(),
  period: integer("period").notNull(),
  startTime: varchar("start_time", { length: 10 }).notNull(),
  endTime: varchar("end_time", { length: 10 }).notNull(),
  subject: text("subject").notNull(),
  subjectCode: varchar("subject_code", { length: 20 }).notNull(),
  faculty: varchar("faculty", { length: 100 }),
  room: varchar("room", { length: 20 }),
});

export const insertTimetableSchema = createInsertSchema(timetableTable);
export type InsertTimetable = z.infer<typeof insertTimetableSchema>;
export type Timetable = typeof timetableTable.$inferSelect;
