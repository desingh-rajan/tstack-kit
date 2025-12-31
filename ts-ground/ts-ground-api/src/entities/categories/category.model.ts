import {
  boolean,
  integer,
  pgTable,
  text,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { commonUuidColumns } from "../../shared/utils/uuid-columns.ts";

/**
 * Categories Table
 *
 * Hierarchical product categories with self-referencing parent_id
 * Supports unlimited nesting (e.g., Electronics > Phones > Smartphones)
 */
export const categories = pgTable("categories", {
  ...commonUuidColumns,

  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),
  parentId: uuid("parent_id"), // Self-reference added via relations
  icon: varchar("icon", { length: 100 }), // Icon name or URL
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

// Type inference from schema
export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

// Category with children (for hierarchical responses)
export interface CategoryWithChildren extends Category {
  children?: CategoryWithChildren[];
}
