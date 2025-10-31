import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { commonColumns } from "../shared/utils/columns.ts";
import { users } from "./user.model.ts";

export const authTokens = pgTable("auth_tokens", {
  ...commonColumns,
  userId: integer("user_id").notNull().references(() => users.id, {
    onDelete: "cascade",
  }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  isRevoked: boolean("is_revoked").default(false).notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
});

// Type inference from schema
export type AuthToken = typeof authTokens.$inferSelect;
export type NewAuthToken = typeof authTokens.$inferInsert;
