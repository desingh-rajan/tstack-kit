/**
 * Payment Types for Admin UI
 */

export type PaymentTransactionStatus =
  | "created"
  | "authorized"
  | "captured"
  | "failed"
  | "refunded";

export interface Payment {
  id: string;
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string | null;
  razorpaySignature: string | null;
  amount: string;
  currency: string;
  status: PaymentTransactionStatus;
  method: string | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  cardLast4: string | null;
  cardNetwork: string | null;
  cardType: string | null;
  email: string | null;
  contact: string | null;
  paidAt: string | null;
  failedAt: string | null;
  refundedAt: string | null;
  errorCode: string | null;
  errorDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RefundRequest {
  amount?: number;
  reason?: string;
}

export interface RefundResponse {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
}
