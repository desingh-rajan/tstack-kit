/**
 * Payment Provider Interface
 *
 * Abstraction layer for payment gateways.
 * Currently implemented: Razorpay
 * Can be extended for: Stripe, PayU, etc.
 */

/**
 * Options for creating a payment order
 */
export interface CreateOrderOptions {
  /** Amount in smallest currency unit (paise for INR) */
  amount: number;
  /** Currency code (default: INR) */
  currency?: string;
  /** Receipt/reference number (order number) */
  receipt: string;
  /** Additional notes for the order */
  notes?: Record<string, string>;
}

/**
 * Payment order returned by provider
 */
export interface PaymentOrder {
  /** Provider's order ID */
  id: string;
  /** Amount in smallest currency unit */
  amount: number;
  /** Currency code */
  currency: string;
  /** Receipt/reference number */
  receipt: string;
  /** Order status from provider */
  status: string;
  /** Raw response from provider */
  raw?: unknown;
}

/**
 * Options for verifying a payment
 */
export interface VerifyPaymentOptions {
  /** Provider's order ID */
  orderId: string;
  /** Provider's payment ID */
  paymentId: string;
  /** Signature to verify */
  signature: string;
}

/**
 * Result of a payment operation
 */
export interface PaymentResult {
  /** Whether the operation succeeded */
  success: boolean;
  /** Payment ID from provider */
  paymentId: string;
  /** Payment status */
  status: string;
  /** Amount in smallest currency unit */
  amount: number;
  /** Currency code */
  currency: string;
  /** Payment method used (card, upi, etc.) */
  method?: string;
  /** Bank name if applicable */
  bank?: string;
  /** Wallet name if applicable */
  wallet?: string;
  /** UPI VPA if applicable */
  vpa?: string;
  /** Raw response from provider */
  raw?: unknown;
}

/**
 * Result of a refund operation
 */
export interface RefundResult {
  /** Whether the refund succeeded */
  success: boolean;
  /** Refund ID from provider */
  refundId: string;
  /** Refund status */
  status: string;
  /** Amount refunded in smallest currency unit */
  amount: number;
  /** Currency code */
  currency: string;
  /** Raw response from provider */
  raw?: unknown;
}

/**
 * Detailed payment information
 */
export interface PaymentDetails {
  /** Payment ID */
  id: string;
  /** Order ID this payment belongs to */
  orderId: string;
  /** Amount in smallest currency unit */
  amount: number;
  /** Currency code */
  currency: string;
  /** Payment status */
  status: string;
  /** Payment method */
  method?: string;
  /** Bank name */
  bank?: string;
  /** Wallet name */
  wallet?: string;
  /** UPI VPA */
  vpa?: string;
  /** Card details (masked) */
  card?: {
    last4: string;
    network: string;
    type: string;
  };
  /** Email used for payment */
  email?: string;
  /** Contact used for payment */
  contact?: string;
  /** When payment was created */
  createdAt: Date;
  /** Raw response from provider */
  raw?: unknown;
}

/**
 * Webhook event from provider
 */
export interface WebhookEvent {
  /** Event type */
  event: string;
  /** Payment details if applicable */
  payment?: PaymentDetails;
  /** Order ID */
  orderId?: string;
  /** Raw payload */
  raw: unknown;
}

/**
 * Payment Provider Interface
 *
 * All payment gateway implementations must implement this interface.
 */
export interface IPaymentProvider {
  /** Provider name for identification */
  readonly name: string;

  /**
   * Create a payment order
   * @param options Order creation options
   * @returns Payment order with provider's order ID
   */
  createOrder(options: CreateOrderOptions): Promise<PaymentOrder>;

  /**
   * Verify payment signature
   * @param options Verification options with IDs and signature
   * @returns True if signature is valid
   */
  verifyPayment(options: VerifyPaymentOptions): Promise<boolean>;

  /**
   * Capture an authorized payment
   * @param paymentId Provider's payment ID
   * @param amount Amount to capture in smallest currency unit
   * @returns Payment result
   */
  capturePayment(paymentId: string, amount: number): Promise<PaymentResult>;

  /**
   * Refund a captured payment
   * @param paymentId Provider's payment ID
   * @param amount Amount to refund (optional, full refund if not provided)
   * @returns Refund result
   */
  refundPayment(paymentId: string, amount?: number): Promise<RefundResult>;

  /**
   * Get payment details
   * @param paymentId Provider's payment ID
   * @returns Detailed payment information
   */
  getPaymentDetails(paymentId: string): Promise<PaymentDetails>;

  /**
   * Verify and parse webhook payload
   * @param payload Raw webhook payload
   * @param signature Webhook signature header
   * @returns Parsed webhook event if valid
   */
  verifyWebhook(
    payload: string,
    signature: string,
  ): Promise<WebhookEvent | null>;
}
