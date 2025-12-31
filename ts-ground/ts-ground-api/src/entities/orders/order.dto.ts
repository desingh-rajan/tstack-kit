import { z } from "zod";
import type {
  AddressSnapshot,
  OrderItemResponse,
  OrderStatus,
  PaymentStatus,
} from "./order.model.ts";

/**
 * Checkout Validation Schema
 * Validates cart before creating order
 */
export const CheckoutValidateSchema = z.object({
  shippingAddressId: z.string().uuid("Invalid shipping address ID"),
  billingAddressId: z.string().uuid("Invalid billing address ID").optional(),
  useSameAddress: z.boolean().default(true),
});

export type CheckoutValidateDTO = z.infer<typeof CheckoutValidateSchema>;

/**
 * Create Order Schema
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
  userId: number;
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
}

/**
 * Order List Response DTO
 */
export interface OrderListResponseDTO {
  orders: OrderSummaryDTO[];
  pagination: {
    page: number;
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
  createdAt: Date;
}

/**
 * Create Order Response (includes Razorpay info if applicable)
 */
export interface CreateOrderResponseDTO extends OrderResponseDTO {
  razorpay?: {
    orderId: string;
    amount: number; // In paise
    currency: string;
    key: string; // Public key for frontend
  };
}
