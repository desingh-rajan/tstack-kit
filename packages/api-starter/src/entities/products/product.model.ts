import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { commonUuidColumns } from "../../shared/utils/uuid-columns.ts";
import { brands } from "../brands/brand.model.ts";
import { categories } from "../categories/category.model.ts";

/**
 * Products Table
 *
 * Main product catalog with:
 * - Brand and category relationships
 * - Pricing (base price, compare-at price for sales)
 * - Inventory (SKU, stock quantity)
 * - Specifications (JSONB for flexible attributes)
 * - Soft delete support (deletedAt)
 */
export const products = pgTable("products", {
  ...commonUuidColumns,

  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  description: text("description"),

  // Relationships
  brandId: uuid("brand_id").references(() => brands.id, {
    onDelete: "set null",
  }),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),

  // Flexible specifications (e.g., {"material": "cast iron", "weight": "2.5kg"})
  specifications: jsonb("specifications").default({}),

  // Pricing
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  compareAtPrice: decimal("compare_at_price", { precision: 12, scale: 2 }), // Original price for sales

  // Inventory
  sku: varchar("sku", { length: 100 }).unique(),
  stockQuantity: integer("stock_quantity").notNull().default(0),

  // Status
  isActive: boolean("is_active").notNull().default(true),
  deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }), // Soft delete
}, (table) => ({
  brandIdIdx: index("idx_products_brand_id").on(table.brandId),
  categoryIdIdx: index("idx_products_category_id").on(table.categoryId),
  skuIdx: index("idx_products_sku").on(table.sku),
  isActiveIdx: index("idx_products_is_active").on(table.isActive),
  deletedAtIdx: index("idx_products_deleted_at").on(table.deletedAt),
  priceIdx: index("idx_products_price").on(table.price),
}));

// Type inference from schema
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// Product with relations (for API responses)
export interface ProductWithRelations extends Omit<Product, "specifications"> {
  specifications: Record<string, unknown>;
  brand?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  images?: Array<
    {
      id: string;
      url: string;
      thumbnailUrl: string | null;
      altText: string | null;
      isPrimary: boolean;
      displayOrder: number;
    }
  >;
  variants?: Array<
    {
      id: string;
      sku: string | null;
      price: string | null;
      stockQuantity: number;
      options: Record<string, string>;
    }
  >;
}
