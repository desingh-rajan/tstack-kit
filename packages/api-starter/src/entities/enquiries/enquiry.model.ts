import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { commonColumns } from "../../shared/utils/columns.ts";

/**
 * Enquiries Table
 * Stores contact form submissions from website visitors
 * Includes anti-spam fields and tracking metadata
 */

// Enquiry status enum
export const ENQUIRY_STATUS = {
  NEW: "new",
  READ: "read",
  REPLIED: "replied",
  SPAM: "spam",
  ARCHIVED: "archived",
} as const;

export type EnquiryStatus = typeof ENQUIRY_STATUS[keyof typeof ENQUIRY_STATUS];

export const enquiries = pgTable("enquiries", {
  ...commonColumns,

  // Contact information (email or phone required - validated at DTO level)
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),

  // Message content
  subject: varchar("subject", { length: 255 }),
  message: text("message").notNull(),

  // Status tracking
  status: varchar("status", { length: 20 }).default("new").notNull(),

  // Admin notes (internal use only)
  adminNotes: text("admin_notes"),

  // Anti-spam tracking
  ipAddress: varchar("ip_address", { length: 45 }), // Supports IPv6
  userAgent: text("user_agent"),
  referrer: text("referrer"),

  // Honeypot field - should always be empty in legitimate submissions
  honeypotTriggered: boolean("honeypot_triggered").default(false).notNull(),

  // Time-based validation - track submission time for spam detection
  formLoadedAt: timestamp("form_loaded_at", { mode: "date" }),

  // Status timestamps
  readAt: timestamp("read_at", { mode: "date" }),
  repliedAt: timestamp("replied_at", { mode: "date" }),

  // Admin who marked as read/replied
  readBy: integer("read_by"),
  repliedBy: integer("replied_by"),
});

// Type inference from schema
export type Enquiry = typeof enquiries.$inferSelect;
export type NewEnquiry = typeof enquiries.$inferInsert;
