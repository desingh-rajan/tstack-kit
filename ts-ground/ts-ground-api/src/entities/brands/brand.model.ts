import { boolean, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { commonUuidColumns } from "../../shared/utils/uuid-columns.ts";

/**
 * Brands Table
 *
 * Stores brand information for products (e.g., "Lodge", "Le Creuset")
 * Each product can optionally belong to a brand
 */
export const brands = pgTable("brands", {
  ...commonUuidColumns,

  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
});

// Type inference from schema
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
