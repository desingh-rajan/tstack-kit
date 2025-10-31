import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { commonColumns } from "../shared/utils/columns.ts";

export const users = pgTable("users", {
  ...commonColumns,
  username: text("username"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
});

// Type inference from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

// User without sensitive fields (for responses)
export type SafeUser = Omit<User, "password">;
