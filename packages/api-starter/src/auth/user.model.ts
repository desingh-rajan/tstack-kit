import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { commonColumns } from "../shared/utils/columns.ts";

/**
 * User Roles
 * - superadmin: System-defined, only one exists, full access
 * - admin: Can be created later, administrative access
 * - moderator: Can be created later, moderation access
 * - user: Default role for regular users
 */
export type UserRole = "superadmin" | "admin" | "moderator" | "user";

export const users = pgTable("users", {
  ...commonColumns,
  username: text("username"),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  password: text("password").notNull(),
  role: text("role").default("user").notNull(), // superadmin, admin, moderator, user
  isEmailVerified: boolean("is_email_verified").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  lastLoginAt: timestamp("last_login_at", { mode: "date" }),
});

// Type inference from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// User without sensitive fields (for responses)
export type SafeUser = Omit<User, "password">;
