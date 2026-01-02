/**
 * Payment Provider Interface
 *
 * Abstraction layer for payment gateways.
 * Currently implemented: Razorpay
 * Can be extended for: Stripe, PayU, etc.
 *
 * Architecture:
 * - IPaymentProvider: Interface all providers must implement
 * - BasePaymentProvider: Abstract class with common utilities
 * - createPaymentProvider(): Factory function for provider selection
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

/**
 * Base Payment Provider
 *
 * Abstract class providing common utilities for payment providers.
 * Extend this class when implementing a new payment provider.
 */
export abstract class BasePaymentProvider implements IPaymentProvider {
  abstract readonly name: string;

  abstract createOrder(options: CreateOrderOptions): Promise<PaymentOrder>;
  abstract verifyPayment(options: VerifyPaymentOptions): Promise<boolean>;
  abstract capturePayment(
    paymentId: string,
    amount: number,
  ): Promise<PaymentResult>;
  abstract refundPayment(
    paymentId: string,
    amount?: number,
  ): Promise<RefundResult>;
  abstract getPaymentDetails(paymentId: string): Promise<PaymentDetails>;
  abstract verifyWebhook(
    payload: string,
    signature: string,
  ): Promise<WebhookEvent | null>;

  /**
   * Convert amount to smallest currency unit (paise, cents, etc.)
   * @param amount Amount in major currency unit
   * @param currency Currency code
   * @returns Amount in smallest unit
   */
  protected formatAmount(amount: number, currency: string = "INR"): number {
    const noDecimalCurrencies = ["JPY", "KRW", "VND", "IDR"];
    if (noDecimalCurrencies.includes(currency.toUpperCase())) {
      return Math.round(amount);
    }
    return Math.round(amount * 100);
  }

  /**
   * Convert amount from smallest currency unit to major unit
   * @param amount Amount in smallest unit
   * @param currency Currency code
   * @returns Amount in major unit
   */
  protected parseAmount(amount: number, currency: string = "INR"): number {
    const noDecimalCurrencies = ["JPY", "KRW", "VND", "IDR"];
    if (noDecimalCurrencies.includes(currency.toUpperCase())) {
      return amount;
    }
    return amount / 100;
  }

  /**
   * Generate a unique receipt/reference number
   * @returns Receipt string
   */
  protected generateReceipt(): string {
    return `receipt_${Date.now()}_${
      Math.random().toString(36).substring(2, 11)
    }`;
  }
}

/**
 * No-Op Payment Provider
 *
 * Mock implementation for development and testing.
 * Returns mock data without making actual API calls.
 */
export class NoOpPaymentProvider extends BasePaymentProvider {
  readonly name = "noop";

  constructor() {
    super();
    console.warn(
      "[NoOpPaymentProvider] Using mock payment provider - no real payments will be processed",
    );
  }

  createOrder(options: CreateOrderOptions): Promise<PaymentOrder> {
    console.info("[NoOpPaymentProvider] createOrder called:", options);
    return Promise.resolve({
      id: `mock_order_${Date.now()}`,
      amount: options.amount,
      currency: options.currency || "INR",
      receipt: options.receipt,
      status: "created",
    });
  }

  verifyPayment(_options: VerifyPaymentOptions): Promise<boolean> {
    console.info("[NoOpPaymentProvider] verifyPayment called - returning true");
    return Promise.resolve(true);
  }

  capturePayment(
    paymentId: string,
    amount: number,
  ): Promise<PaymentResult> {
    console.info(
      "[NoOpPaymentProvider] capturePayment called:",
      paymentId,
      amount,
    );
    return Promise.resolve({
      success: true,
      paymentId,
      status: "captured",
      amount,
      currency: "INR",
    });
  }

  refundPayment(
    paymentId: string,
    amount?: number,
  ): Promise<RefundResult> {
    console.info(
      "[NoOpPaymentProvider] refundPayment called:",
      paymentId,
      amount,
    );
    return Promise.resolve({
      success: true,
      refundId: `mock_refund_${Date.now()}`,
      status: "processed",
      amount: amount || 0,
      currency: "INR",
    });
  }

  getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
    console.info("[NoOpPaymentProvider] getPaymentDetails called:", paymentId);
    return Promise.resolve({
      id: paymentId,
      orderId: `mock_order_${Date.now()}`,
      amount: 10000,
      currency: "INR",
      status: "captured",
      method: "mock",
      createdAt: new Date(),
    });
  }

  verifyWebhook(
    payload: string,
    _signature: string,
  ): Promise<WebhookEvent | null> {
    console.info("[NoOpPaymentProvider] verifyWebhook called");
    try {
      const parsed = JSON.parse(payload);
      return Promise.resolve({
        event: parsed.event || "payment.captured",
        orderId: parsed.payload?.payment?.entity?.order_id,
        raw: parsed,
      });
    } catch {
      return Promise.resolve(null);
    }
  }
}
