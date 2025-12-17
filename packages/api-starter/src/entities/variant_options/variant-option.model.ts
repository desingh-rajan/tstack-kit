import {
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Variant Options Table
 *
 * Global lookup table for variant options
 * Examples:
 * - type: "size", name: "10 inch"
 * - type: "size", name: "12 inch"
 * - type: "color", name: "Silver"
 * - type: "finish", name: "Pre-seasoned"
 *
 * These are shared across products - define once, use many times
 */
export const variantOptions = pgTable("variant_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(), // e.g., "10 inch", "Red"
  type: varchar("type", { length: 50 }).notNull(), // e.g., "size", "color", "finish"
  displayOrder: integer("display_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow().notNull(),
}, (table) => ({
  // Ensure unique combination of name + type
  nameTypeIdx: uniqueIndex("idx_variant_options_name_type").on(
    table.name,
    table.type,
  ),
  typeIdx: index("idx_variant_options_type").on(table.type),
}));

// Type inference from schema
export type VariantOption = typeof variantOptions.$inferSelect;
export type NewVariantOption = typeof variantOptions.$inferInsert;

// Common variant types
export const VARIANT_TYPES = [
  "size",
  "color",
  "finish",
  "material",
  "lid",
  "handle",
] as const;
export type VariantType = typeof VARIANT_TYPES[number];
