import { decimal, index, integer, pgTable, uuid } from "drizzle-orm/pg-core";
import { commonUuidColumns } from "../../shared/utils/uuid-columns.ts";
import { carts } from "./cart.model.ts";
import { products } from "../products/product.model.ts";
import { productVariants } from "../product_variants/product-variant.model.ts";

/**
 * Cart Items Table
 *
 * Individual items in a shopping cart.
 * Stores the price at time of adding to handle price changes.
 */
export const cartItems = pgTable("cart_items", {
  ...commonUuidColumns,

  // Cart relationship
  cartId: uuid("cart_id")
    .references(() => carts.id, { onDelete: "cascade" })
    .notNull(),

  // Product relationship
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),

  // Optional variant
  variantId: uuid("variant_id")
    .references(() => productVariants.id, { onDelete: "cascade" }),

  // Quantity
  quantity: integer("quantity").notNull().default(1),

  // Price snapshot at time of adding (for price change tracking)
  priceAtAdd: decimal("price_at_add", { precision: 12, scale: 2 }).notNull(),
}, (table) => ({
  cartIdIdx: index("idx_cart_items_cart_id").on(table.cartId),
  productIdIdx: index("idx_cart_items_product_id").on(table.productId),
  variantIdIdx: index("idx_cart_items_variant_id").on(table.variantId),
  // Unique constraint: one product/variant combo per cart
  cartProductVariantIdx: index("idx_cart_items_cart_product_variant")
    .on(table.cartId, table.productId, table.variantId),
}));

// Type inference from schema
export type CartItem = typeof cartItems.$inferSelect;
export type NewCartItem = typeof cartItems.$inferInsert;
