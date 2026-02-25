import { z } from "zod";

/**
 * Payment DTOs and Validation Schemas
 */

// ============================================
// Request Schemas
// ============================================

/**
 * Create payment order request
 * Used when user clicks "Pay Now"
 */
export const CreatePaymentOrderSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
});

export type CreatePaymentOrderDto = z.infer<typeof CreatePaymentOrderSchema>;

/**
 * Verify payment request
 * Called after Razorpay checkout returns
 */
export const VerifyPaymentSchema = z.object({
  orderId: z.string().uuid("Invalid order ID"),
  razorpayOrderId: z.string().min(1, "Razorpay order ID required"),
  razorpayPaymentId: z.string().min(1, "Razorpay payment ID required"),
  razorpaySignature: z.string().min(1, "Razorpay signature required"),
});

export type VerifyPaymentDto = z.infer<typeof VerifyPaymentSchema>;

/**
 * Refund payment request (admin only)
 */
export const RefundPaymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").optional(),
  reason: z.string().max(500).optional(),
});

export type RefundPaymentDto = z.infer<typeof RefundPaymentSchema>;

/**
 * Manual refund request for COD/UPI orders (admin only)
 */
export const ManualRefundSchema = z.object({
  reason: z.string().max(500).optional(),
  transactionRef: z.string().min(1, "Transaction reference is required").max(
    200,
  ),
  refundDate: z.string().min(1, "Refund date is required"),
});

export type ManualRefundDto = z.infer<typeof ManualRefundSchema>;

// ============================================
// Response DTOs
// ============================================

/**
 * Response when creating a payment order
 * Frontend uses this to initialize Razorpay checkout
 */
export interface PaymentOrderResponse {
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number; // In paise
  currency: string;
  orderId: string;
  orderNumber: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
}

/**
 * Response after successful payment verification
 */
export interface PaymentVerifyResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  paymentId: string;
  status: string;
  message: string;
}

/**
 * Payment status response
 */
export interface PaymentStatusResponse {
  orderId: string;
  orderNumber: string;
  paymentStatus: string;
  payment?: {
    id: string;
    razorpayPaymentId: string | null;
    amount: string;
    currency: string;
    method: string | null;
    status: string;
    paidAt: string | null;
  };
}

/**
 * Refund response
 */
export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
}
