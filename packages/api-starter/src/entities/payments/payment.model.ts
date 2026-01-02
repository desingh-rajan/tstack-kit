import {
  decimal,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { commonUuidColumns } from "../../shared/utils/uuid-columns.ts";
import { orders } from "../orders/order.model.ts";

/**
 * Payment Status Enum
 *
 * created    - Razorpay order created, awaiting payment
 * authorized - Payment authorized (for manual capture)
 * captured   - Payment captured successfully
 * failed     - Payment failed
 * refunded   - Payment refunded (full or partial)
 */
export const paymentTransactionStatusEnum = pgEnum(
  "payment_transaction_status",
  [
    "created",
    "authorized",
    "captured",
    "failed",
    "refunded",
  ],
);

/**
 * Payments Table
 *
 * Stores payment transactions from Razorpay.
 * Each order can have multiple payment attempts.
 */
export const payments = pgTable("payments", {
  ...commonUuidColumns,

  // Order reference
  orderId: uuid("order_id").references(() => orders.id, {
    onDelete: "cascade",
  }).notNull(),

  // Razorpay identifiers
  razorpayOrderId: text("razorpay_order_id").notNull(),
  razorpayPaymentId: text("razorpay_payment_id"),
  razorpaySignature: text("razorpay_signature"),

  // Amount (in INR, stored as decimal)
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").default("INR").notNull(),

  // Status
  status: paymentTransactionStatusEnum("status").default("created").notNull(),

  // Payment method details
  method: text("method"), // card, upi, netbanking, wallet
  bank: text("bank"),
  wallet: text("wallet"),
  vpa: text("vpa"), // UPI ID

  // Card details (partial, for display)
  cardLast4: text("card_last4"),
  cardNetwork: text("card_network"),
  cardType: text("card_type"),

  // Contact info used for payment
  email: text("email"),
  contact: text("contact"),

  // Timestamps for status changes
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  refundedAt: timestamp("refunded_at"),

  // Error info if failed
  errorCode: text("error_code"),
  errorDescription: text("error_description"),

  // Raw response from Razorpay (for debugging)
  razorpayResponse: jsonb("razorpay_response"),
}, (table) => ({
  orderIdIdx: index("idx_payments_order_id").on(table.orderId),
  razorpayOrderIdIdx: index("idx_payments_razorpay_order_id").on(
    table.razorpayOrderId,
  ),
  razorpayPaymentIdIdx: index("idx_payments_razorpay_payment_id").on(
    table.razorpayPaymentId,
  ),
  statusIdx: index("idx_payments_status").on(table.status),
}));

// Type inference from schema
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type PaymentTransactionStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";
