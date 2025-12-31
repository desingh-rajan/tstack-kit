import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { commonUuidColumns } from "../../shared/utils/uuid-columns.ts";
import { users } from "../../auth/user.model.ts";

/**
 * Carts Table
 *
 * Shopping carts with support for both authenticated users and guests.
 * Guest carts use a cookie-based guestId and expire after 7 days.
 *
 * Cart Status:
 * - active: Currently being used
 * - converted: Converted to an order
 * - abandoned: Expired or manually abandoned
 */
export const carts = pgTable("carts", {
  ...commonUuidColumns,

  // User relationship (null for guest carts)
  userId: integer("user_id").references(() => users.id, {
    onDelete: "cascade",
  }),

  // Guest identifier (UUID stored in cookie)
  guestId: text("guest_id"),

  // Cart status
  status: text("status").notNull().default("active"), // active | converted | abandoned

  // Guest cart expiry (7 days from creation)
  expiresAt: timestamp("expires_at", { withTimezone: true, mode: "date" }),

  // Notes (e.g., special instructions)
  notes: text("notes"),
}, (table) => ({
  userIdIdx: index("idx_carts_user_id").on(table.userId),
  guestIdIdx: index("idx_carts_guest_id").on(table.guestId),
  statusIdx: index("idx_carts_status").on(table.status),
  expiresAtIdx: index("idx_carts_expires_at").on(table.expiresAt),
}));

// Type inference from schema
export type Cart = typeof carts.$inferSelect;
export type NewCart = typeof carts.$inferInsert;

// Cart status type
export type CartStatus = "active" | "converted" | "abandoned";

// Cart with calculated totals (for API responses)
export interface CartWithTotals extends Cart {
  items: CartItemWithProduct[];
  itemCount: number;
  subtotal: number;
}

// Cart item with product details
export interface CartItemWithProduct {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  priceAtAdd: string;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    stockQuantity: number;
    isActive: boolean;
    primaryImage?: {
      url: string;
      thumbnailUrl: string | null;
    } | null;
  };
  variant?: {
    id: string;
    sku: string | null;
    price: string | null;
    stockQuantity: number;
    options: Record<string, string>;
    isActive: boolean;
  } | null;
}
