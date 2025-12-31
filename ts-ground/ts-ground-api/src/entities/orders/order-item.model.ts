import {
  decimal,
  index,
  integer,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { commonUuidColumns } from "../../shared/utils/uuid-columns.ts";
import { orders } from "./order.model.ts";
import { products } from "../products/product.model.ts";
import { productVariants } from "../product_variants/product-variant.model.ts";

/**
 * Order Items Table
 *
 * Line items for each order:
 * - Product and variant references
 * - Snapshot of product details at purchase time
 * - Price and quantity
 * - Total calculated price
 */
export const orderItems = pgTable("order_items", {
  ...commonUuidColumns,

  // Parent order
  orderId: uuid("order_id").references(() => orders.id, {
    onDelete: "cascade",
  }).notNull(),

  // Product references (for linking back)
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }).notNull(),
  variantId: uuid("variant_id").references(() => productVariants.id, {
    onDelete: "set null",
  }),

  // Snapshot at purchase time (immutable)
  productName: text("product_name").notNull(),
  variantName: text("variant_name"),
  sku: text("sku"),
  productImage: text("product_image"), // Primary image URL at purchase time

  // Pricing (at purchase time)
  price: decimal("price", { precision: 12, scale: 2 }).notNull(), // Unit price
  quantity: integer("quantity").notNull(),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(), // price * quantity
}, (table) => ({
  orderIdIdx: index("idx_order_items_order_id").on(table.orderId),
  productIdIdx: index("idx_order_items_product_id").on(table.productId),
}));

// Type inference from schema
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
