import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { products } from "../products/product.model.ts";
import { productImages } from "../product_images/product-image.model.ts";

/**
 * Product Variants Table
 *
 * Stores individual purchasable variants for a product
 * Each variant has its own:
 * - SKU
 * - Price (optional, falls back to product base price)
 * - Stock quantity
 * - Options (JSONB, e.g., {"size": "10 inch", "finish": "Pre-seasoned"})
 * - Associated image
 */
export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id").notNull().references(() => products.id, {
    onDelete: "cascade",
  }),
  sku: varchar("sku", { length: 100 }).unique(),
  price: decimal("price", { precision: 12, scale: 2 }), // Null = use product base price
  compareAtPrice: decimal("compare_at_price", { precision: 12, scale: 2 }),
  stockQuantity: integer("stock_quantity").notNull().default(0),
  options: jsonb("options").notNull().default({}), // e.g., {"size": "10 inch", "color": "Silver"}
  imageId: uuid("image_id").references(() => productImages.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow().notNull(),
}, (table) => ({
  productIdIdx: index("idx_product_variants_product_id").on(table.productId),
  skuIdx: index("idx_product_variants_sku").on(table.sku),
  isActiveIdx: index("idx_product_variants_is_active").on(table.isActive),
}));

// Type inference from schema
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;

// Variant with resolved image
export interface ProductVariantWithImage extends ProductVariant {
  image?: { id: string; url: string; thumbnailUrl: string | null } | null;
}
