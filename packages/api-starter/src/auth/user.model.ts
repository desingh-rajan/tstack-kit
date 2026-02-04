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

  // Email verification fields
  emailVerificationToken: text("email_verification_token"),
  emailVerificationExpiry: timestamp("email_verification_expiry", {
    mode: "date",
  }),

  // Password reset fields
  passwordResetToken: text("password_reset_token"),
  passwordResetExpiry: timestamp("password_reset_expiry", { mode: "date" }),

  // OAuth fields (for Google/GitHub login)
  googleId: text("google_id").unique(),
  facebookId: text("facebook_id").unique(),
  avatarUrl: text("avatar_url"),
  firstName: text("first_name"),
  lastName: text("last_name"),
});

// Type inference from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// User without sensitive fields (for responses)
export type SafeUser = Omit<
  User,
  "password" | "emailVerificationToken" | "passwordResetToken"
>;
