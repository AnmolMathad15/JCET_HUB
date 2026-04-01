import { pgTable, text, varchar, timestamp, boolean, integer } from "drizzle-orm/pg-core";

export const eventRegistrationsTable = pgTable("event_registrations", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name"),
  studentUsn: text("student_usn"),
  email: text("email"),
  phone: varchar("phone", { length: 15 }),
  branch: varchar("branch", { length: 60 }),
  semester: varchar("semester", { length: 5 }),
  yearOfStudy: varchar("year_of_study", { length: 10 }),
  teamName: text("team_name"),
  teamMembers: text("team_members"),
  paymentMode: varchar("payment_mode", { length: 20 }),
  transactionId: text("transaction_id"),
  paymentAmount: integer("payment_amount"),
  paymentScreenshotUrl: text("payment_screenshot_url"),
  paymentStatus: varchar("payment_status", { length: 20 }).default("pending"),
  additionalInfo: text("additional_info"),
  registeredAt: timestamp("registered_at").defaultNow(),
  attended: boolean("attended").default(false).notNull(),
  attendedAt: timestamp("attended_at"),
  qrToken: text("qr_token"),
  status: varchar("status", { length: 20 }).default("registered").notNull(),
});

export type EventRegistration = typeof eventRegistrationsTable.$inferSelect;
