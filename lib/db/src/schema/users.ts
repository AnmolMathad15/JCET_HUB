import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  usn: varchar("usn", { length: 20 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: varchar("role", { length: 20 }).notNull().default("student"),
  branch: varchar("branch", { length: 50 }),
  semester: varchar("semester", { length: 5 }),
  email: text("email"),
  phone: varchar("phone", { length: 15 }),
  departmentId: text("department_id"),
  batchId: text("batch_id"),
  admissionType: varchar("admission_type", { length: 20 }).default("KCET"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
