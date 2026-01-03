import { boolean, integer, pgTable, text } from "drizzle-orm/pg-core";
import { commonUuidColumns } from "../../shared/utils/uuid-columns.ts";
import { users } from "../../auth/user.model.ts";

/**
 * Addresses Table
 *
 * User shipping/billing addresses for orders
 * Each user can have multiple addresses with one default per type
 */
export const addresses = pgTable("addresses", {
  ...commonUuidColumns,

  // User relationship
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // Address label (Home, Work, Mom's House, etc.)
  label: text("label"),

  // Contact information
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),

  // Address fields
  addressLine1: text("address_line_1").notNull(),
  addressLine2: text("address_line_2"),
  city: text("city").notNull(),
  state: text("state").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("India"),

  // Address type and default status
  type: text("type").notNull().default("shipping"), // shipping | billing
  isDefault: boolean("is_default").notNull().default(false),
});

// Type inference from schema
export type Address = typeof addresses.$inferSelect;
export type NewAddress = typeof addresses.$inferInsert;

// Address type enum
export type AddressType = "shipping" | "billing";
