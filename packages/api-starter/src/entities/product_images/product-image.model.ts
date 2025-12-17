import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex as _uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { products } from "../products/product.model.ts";

/**
 * Product Images Table
 *
 * Stores image URLs for products with:
 * - Multiple images per product (ordered by displayOrder)
 * - Primary image flag (only one per product)
 * - Alt text for accessibility/SEO
 *
 * Note: Actual images stored in S3, URLs stored here
 */
export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, {
    onDelete: "cascade",
  }),
  url: text("url").notNull(), // Full-size image URL
  thumbnailUrl: text("thumbnail_url"), // Optional thumbnail (for now, same as url)
  altText: varchar("alt_text", { length: 255 }),
  displayOrder: integer("display_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index("idx_product_images_product_id").on(table.productId),
  isPrimaryIdx: index("idx_product_images_is_primary").on(table.isPrimary),
  displayOrderIdx: index("idx_product_images_display_order").on(
    table.displayOrder,
  ),
  // Ensure only one primary image per product (partial unique index)
  // Note: Drizzle doesn't support partial unique indexes directly, handle in service
}));

// Type inference from schema
export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;
