import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const batchesTable = pgTable("batches", {
  id: text("id").primaryKey(),
  name: varchar("name", { length: 20 }).notNull(),
  departmentId: text("department_id"),
  semester: varchar("semester", { length: 5 }),
  year: varchar("year", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBatchSchema = createInsertSchema(batchesTable).omit({ createdAt: true });
export type InsertBatch = z.infer<typeof insertBatchSchema>;
export type Batch = typeof batchesTable.$inferSelect;
