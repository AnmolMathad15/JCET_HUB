import { pgTable, text, varchar, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marksTable = pgTable("marks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  subject: text("subject").notNull(),
  subjectCode: varchar("subject_code", { length: 20 }).notNull(),
  ia1: real("ia1").notNull().default(0),
  ia2: real("ia2").notNull().default(0),
  ia3: real("ia3").notNull().default(0),
  finalMarks: real("final_marks"),
  maxMarks: real("max_marks").notNull().default(100),
  grade: varchar("grade", { length: 5 }),
});

export const insertMarksSchema = createInsertSchema(marksTable);
export type InsertMarks = z.infer<typeof insertMarksSchema>;
export type Marks = typeof marksTable.$inferSelect;
