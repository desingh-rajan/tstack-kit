import { z } from "zod";
import type {
  AddressSnapshot,
  OrderItemResponse,
  OrderStatus,
  PaymentStatus,
} from "./order.model.ts";

/**
 * Guest Address Schema
 * Inline address for guest checkout (not saved to addresses table).
 * Uses relaxed validation -- customize regex patterns for your locale.
 */
export const GuestAddressSchema = z.object({
  fullName: z.string().min(1, "Full name is required").max(
    100,
    "Name too long",
  ),
  phone: z.string()
    .min(7, "Phone number is required")
    .max(20, "Phone number too long"),
  addressLine1: z.string()
    .min(1, "Address line 1 is required")
    .max(255, "Address too long"),
  addressLine2: z.string().max(255, "Address too long").optional().nullable(),
  city: z.string().min(1, "City is required").max(100, "City name too long"),
  state: z.string().min(1, "State is required").max(100, "State name too long"),
  postalCode: z.string()
    .min(1, "Postal code is required")
    .max(20, "Postal code too long"),
  country: z.string().max(100).optional().default("US"),
});

export type GuestAddressDTO = z.infer<typeof GuestAddressSchema>;

/**
 * Checkout Validation Schema (Authenticated Users)
 * Validates cart before creating order
 */
export const CheckoutValidateSchema = z.object({
  shippingAddressId: z.string().uuid("Invalid shipping address ID"),
  billingAddressId: z.string().uuid("Invalid billing address ID").optional(),
  useSameAddress: z.boolean().default(true),
});

export type CheckoutValidateDTO = z.infer<typeof CheckoutValidateSchema>;

/**
 * Guest Checkout Validation Schema
 * Validates cart with inline addresses for guest users
 */
export const GuestCheckoutValidateSchema = z.object({
  guestEmail: z.string().email("Valid email is required"),
  shippingAddress: GuestAddressSchema,
  billingAddress: GuestAddressSchema.optional(),
  useSameAddress: z.boolean().default(true),
});

export type GuestCheckoutValidateDTO = z.infer<
  typeof GuestCheckoutValidateSchema
>;

/**
 * Create Order Schema (Authenticated Users)
 * Creates order from validated cart
 */
export const CreateOrderSchema = z.object({
  shippingAddressId: z.string().uuid("Invalid shipping address ID"),
  billingAddressId: z.string().uuid("Invalid billing address ID").optional(),
  useSameAddress: z.boolean().default(true),
  paymentMethod: z.enum(["razorpay", "cod"]).default("razorpay"),
  customerNotes: z.string().max(500, "Notes too long").optional(),
});

export type CreateOrderDTO = z.infer<typeof CreateOrderSchema>;

/**
 * Guest Create Order Schema
 * Creates order for guest users with inline addresses
 */
export const GuestCreateOrderSchema = z.object({
  guestEmail: z.string().email("Valid email is required"),
  shippingAddress: GuestAddressSchema,
  billingAddress: GuestAddressSchema.optional(),
  useSameAddress: z.boolean().default(true),
  paymentMethod: z.enum(["razorpay", "cod"]).default("razorpay"),
  customerNotes: z.string().max(500, "Notes too long").optional(),
});

export type GuestCreateOrderDTO = z.infer<typeof GuestCreateOrderSchema>;

/**
 * Track Order Schema
 * Allows guests to track orders by order number and email
 */
export const TrackOrderSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  email: z.string().email("Valid email is required"),
});

export type TrackOrderDTO = z.infer<typeof TrackOrderSchema>;

/**
 * Update Order Status Schema (Admin)
 */
export const UpdateOrderStatusSchema = z.object({
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]),
  adminNotes: z.string().max(1000).optional(),
});

export type UpdateOrderStatusDTO = z.infer<typeof UpdateOrderStatusSchema>;

/**
 * Order List Query Schema
 */
export const OrderListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
  status: z.enum([
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
  ]).optional(),
  paymentStatus: z.enum(["pending", "paid", "failed", "refunded"]).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(), // Search by order number
});

export type OrderListQueryDTO = z.infer<typeof OrderListQuerySchema>;

/**
 * Checkout Validation Response
 */
export interface CheckoutValidationResponse {
  valid: boolean;
  cart: {
    id: string;
    itemCount: number;
    uniqueItemCount: number;
    subtotal: string;
  };
  shipping: {
    amount: string;
    freeShippingThreshold: string;
    isFreeShipping: boolean;
  };
  tax: {
    rate: string;
    amount: string;
  };
  discount: {
    amount: string;
    code?: string;
  };
  totals: {
    subtotal: string;
    shipping: string;
    tax: string;
    discount: string;
    total: string;
  };
  issues: StockIssue[];
  shippingAddress: AddressSnapshot | null;
  billingAddress: AddressSnapshot | null;
}

export interface StockIssue {
  itemId: string;
  productId: string;
  variantId: string | null;
  productName: string;
  requested: number;
  available: number;
  issue: "out_of_stock" | "insufficient_stock" | "product_unavailable";
}

/**
 * Order Response DTO
 */
export interface OrderResponseDTO {
  id: string;
  orderNumber: string;
  userId: number | null;
  isGuest: boolean;
  guestEmail: string | null;
  guestPhone: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subtotal: string;
  taxAmount: string;
  shippingAmount: string;
  discountAmount: string;
  totalAmount: string;
  paymentMethod: string | null;
  razorpayOrderId: string | null;
  customerNotes: string | null;
  shippingAddress: AddressSnapshot | null;
  billingAddress: AddressSnapshot | null;
  items: OrderItemResponse[];
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    email: string;
    phone?: string;
    username?: string;
  };
}

/**
 * Order List Response DTO
 */
export interface OrderListResponseDTO {
  orders: OrderSummaryDTO[];
  pagination: {
    page: number;
    pageSize: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Order Summary DTO (for lists)
 */
export interface OrderSummaryDTO {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: string;
  itemCount: number;
  isGuest: boolean;
  guestEmail: string | null;
  guestPhone: string | null;
  createdAt: Date;
  user?: {
    id: number;
    email: string;
    phone?: string;
    username?: string;
  };
}

/**
 * Create Order Response (includes Razorpay info if applicable)
 */
export interface CreateOrderResponseDTO extends OrderResponseDTO {
  razorpay?: {
    orderId: string;
    amount: number; // In smallest currency unit (e.g. paise for INR, cents for USD)
    currency: string;
    key: string; // Public key for frontend
  };
}

/**
 * Track Order Response DTO
 * Sanitized order data for guest order tracking
 */
export interface TrackOrderResponseDTO {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: string;
  paymentMethod: string | null;
  shippingAddress: AddressSnapshot | null;
  items: OrderItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}
