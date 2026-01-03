import {
  decimal,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { commonUuidColumns } from "../../shared/utils/uuid-columns.ts";
import { users } from "../../auth/user.model.ts";
import { addresses } from "../addresses/address.model.ts";

/**
 * Order Status Enum
 *
 * pending    - Order created, awaiting payment
 * confirmed  - Payment received, processing
 * processing - Being prepared/packed
 * shipped    - Handed to carrier
 * delivered  - Successfully delivered
 * cancelled  - Order cancelled
 * refunded   - Payment refunded
 */
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

/**
 * Payment Status Enum
 *
 * pending   - Awaiting payment
 * paid      - Payment successful
 * failed    - Payment failed
 * refunded  - Payment refunded
 */
export const paymentStatusEnum = pgEnum("payment_status", [
  "pending",
  "paid",
  "failed",
  "refunded",
]);

/**
 * Orders Table
 *
 * Main order record with:
 * - Order number (SC-YYYYMMDD-XXXXX format)
 * - User reference
 * - Totals (subtotal, tax, shipping, discount, total)
 * - Status tracking
 * - Address snapshots (immutable copy at purchase time)
 * - Payment information
 */
export const orders = pgTable("orders", {
  ...commonUuidColumns,

  // Order identifier
  orderNumber: text("order_number").notNull().unique(), // SC-20260107-00001

  // User reference
  userId: integer("user_id").references(() => users.id, {
    onDelete: "set null",
  }).notNull(),

  // Totals (all in INR)
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).default("0.00")
    .notNull(),
  shippingAmount: decimal("shipping_amount", { precision: 12, scale: 2 })
    .default("0.00").notNull(),
  discountAmount: decimal("discount_amount", { precision: 12, scale: 2 })
    .default("0.00").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),

  // Status tracking
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending")
    .notNull(),

  // Address references (for linking)
  shippingAddressId: uuid("shipping_address_id").references(
    () => addresses.id,
    {
      onDelete: "set null",
    },
  ),
  billingAddressId: uuid("billing_address_id").references(() => addresses.id, {
    onDelete: "set null",
  }),

  // Address snapshots (immutable copy at purchase time)
  shippingAddressSnapshot: jsonb("shipping_address_snapshot"),
  billingAddressSnapshot: jsonb("billing_address_snapshot"),

  // Payment information
  paymentMethod: text("payment_method"), // razorpay, cod
  razorpayOrderId: text("razorpay_order_id"),
  razorpayPaymentId: text("razorpay_payment_id"),

  // Notes
  customerNotes: text("customer_notes"),
  adminNotes: text("admin_notes"),
}, (table) => ({
  userIdIdx: index("idx_orders_user_id").on(table.userId),
  statusIdx: index("idx_orders_status").on(table.status),
  paymentStatusIdx: index("idx_orders_payment_status").on(table.paymentStatus),
  orderNumberIdx: index("idx_orders_order_number").on(table.orderNumber),
  createdAtIdx: index("idx_orders_created_at").on(table.createdAt),
}));

// Type inference from schema
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

// Address snapshot type (stored in JSONB)
export interface AddressSnapshot {
  id: string;
  label?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Order with relations (for API responses)
export interface OrderWithItems extends Order {
  items: OrderItemResponse[];
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  price: string;
  quantity: number;
  totalPrice: string;
  productImage?: string | null;
}
