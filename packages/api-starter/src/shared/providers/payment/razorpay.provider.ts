/**
 * Razorpay Payment Provider
 *
 * Implementation of IPaymentProvider for Razorpay gateway.
 *
 * Environment Variables:
 * - RAZORPAY_KEY_ID: Your Razorpay key ID
 * - RAZORPAY_KEY_SECRET: Your Razorpay key secret
 * - RAZORPAY_WEBHOOK_SECRET: Webhook signature secret
 *
 * @see https://razorpay.com/docs/api/
 */

import type {
  CreateOrderOptions,
  IPaymentProvider,
  PaymentDetails,
  PaymentOrder,
  PaymentResult,
  RefundResult,
  VerifyPaymentOptions,
  WebhookEvent,
} from "./payment-provider.interface.ts";

const RAZORPAY_API_URL = "https://api.razorpay.com/v1";

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
}

/**
 * Razorpay Provider Implementation
 */
export class RazorpayProvider implements IPaymentProvider {
  readonly name = "razorpay";
  private readonly config: RazorpayConfig;
  private readonly authHeader: string;

  constructor(config?: RazorpayConfig) {
    this.config = config || {
      keyId: Deno.env.get("RAZORPAY_KEY_ID") || "",
      keySecret: Deno.env.get("RAZORPAY_KEY_SECRET") || "",
      webhookSecret: Deno.env.get("RAZORPAY_WEBHOOK_SECRET"),
    };

    if (!this.config.keyId || !this.config.keySecret) {
      console.warn(
        "[WARN] Razorpay credentials not configured. Payment features will not work.",
      );
    }

    // Create Basic auth header
    const credentials = btoa(`${this.config.keyId}:${this.config.keySecret}`);
    this.authHeader = `Basic ${credentials}`;
  }

  /**
   * Get public key ID for frontend
   */
  get keyId(): string {
    return this.config.keyId;
  }

  /**
   * Make authenticated request to Razorpay API
   */
  private async request<T>(
    method: string,
    endpoint: string,
    body?: unknown,
  ): Promise<T> {
    const url = `${RAZORPAY_API_URL}${endpoint}`;
    const options: RequestInit = {
      method,
      headers: {
        Authorization: this.authHeader,
        "Content-Type": "application/json",
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Razorpay API error: ${
          error.error?.description || response.statusText
        }`,
      );
    }

    return response.json();
  }

  /**
   * Create a Razorpay order
   */
  async createOrder(options: CreateOrderOptions): Promise<PaymentOrder> {
    const payload = {
      amount: options.amount,
      currency: options.currency || "INR",
      receipt: options.receipt,
      notes: options.notes || {},
    };

    const response = await this.request<RazorpayOrderResponse>(
      "POST",
      "/orders",
      payload,
    );

    return {
      id: response.id,
      amount: response.amount,
      currency: response.currency,
      receipt: response.receipt,
      status: response.status,
      raw: response,
    };
  }

  /**
   * Verify payment signature
   *
   * Razorpay signature = HMAC-SHA256(orderId + "|" + paymentId, keySecret)
   */
  async verifyPayment(options: VerifyPaymentOptions): Promise<boolean> {
    const body = `${options.orderId}|${options.paymentId}`;

    // Use Web Crypto API for HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.keySecret);
    const messageData = encoder.encode(body);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign("HMAC", key, messageData);

    // Convert to hex
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return expectedSignature === options.signature;
  }

  /**
   * Capture an authorized payment
   */
  async capturePayment(
    paymentId: string,
    amount: number,
  ): Promise<PaymentResult> {
    const response = await this.request<RazorpayPaymentResponse>(
      "POST",
      `/payments/${paymentId}/capture`,
      { amount, currency: "INR" },
    );

    return this.mapPaymentResponse(response);
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    paymentId: string,
    amount?: number,
  ): Promise<RefundResult> {
    const payload: { amount?: number } = {};
    if (amount !== undefined) {
      payload.amount = amount;
    }

    const response = await this.request<RazorpayRefundResponse>(
      "POST",
      `/payments/${paymentId}/refund`,
      payload,
    );

    return {
      success: response.status === "processed",
      refundId: response.id,
      status: response.status,
      amount: response.amount,
      currency: response.currency,
      raw: response,
    };
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string): Promise<PaymentDetails> {
    const response = await this.request<RazorpayPaymentResponse>(
      "GET",
      `/payments/${paymentId}`,
    );

    return {
      id: response.id,
      orderId: response.order_id,
      amount: response.amount,
      currency: response.currency,
      status: response.status,
      method: response.method,
      bank: response.bank ?? undefined,
      wallet: response.wallet ?? undefined,
      vpa: response.vpa ?? undefined,
      card: response.card
        ? {
          last4: response.card.last4,
          network: response.card.network,
          type: response.card.type,
        }
        : undefined,
      email: response.email,
      contact: response.contact,
      createdAt: new Date(response.created_at * 1000),
      raw: response,
    };
  }

  /**
   * Verify webhook signature and parse payload
   */
  async verifyWebhook(
    payload: string,
    signature: string,
  ): Promise<WebhookEvent | null> {
    if (!this.config.webhookSecret) {
      console.warn("[WARN] Webhook secret not configured");
      return null;
    }

    // Verify signature
    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.webhookSecret);
    const messageData = encoder.encode(payload);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, messageData);
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (expectedSignature !== signature) {
      console.warn("[WARN] Webhook signature verification failed");
      return null;
    }

    // Parse payload
    const data = JSON.parse(payload) as RazorpayWebhookPayload;

    return {
      event: data.event,
      payment: data.payload?.payment?.entity
        ? {
          id: data.payload.payment.entity.id,
          orderId: data.payload.payment.entity.order_id,
          amount: data.payload.payment.entity.amount,
          currency: data.payload.payment.entity.currency,
          status: data.payload.payment.entity.status,
          method: data.payload.payment.entity.method,
          bank: data.payload.payment.entity.bank ?? undefined,
          wallet: data.payload.payment.entity.wallet ?? undefined,
          vpa: data.payload.payment.entity.vpa ?? undefined,
          createdAt: new Date(data.payload.payment.entity.created_at * 1000),
        }
        : undefined,
      orderId: data.payload?.payment?.entity?.order_id ||
        data.payload?.order?.entity?.id,
      raw: data,
    };
  }

  /**
   * Map Razorpay payment response to PaymentResult
   */
  private mapPaymentResponse(response: RazorpayPaymentResponse): PaymentResult {
    return {
      success: response.status === "captured",
      paymentId: response.id,
      status: response.status,
      amount: response.amount,
      currency: response.currency,
      method: response.method,
      bank: response.bank ?? undefined,
      wallet: response.wallet ?? undefined,
      vpa: response.vpa ?? undefined,
      raw: response,
    };
  }
}

// Razorpay API Response Types

interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  offer_id: string | null;
  status: string;
  attempts: number;
  notes: Record<string, string>;
  created_at: number;
}

interface RazorpayPaymentResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string;
  invoice_id: string | null;
  international: boolean;
  method: string;
  amount_refunded: number;
  refund_status: string | null;
  captured: boolean;
  description: string | null;
  card_id: string | null;
  card: {
    id: string;
    entity: string;
    name: string;
    last4: string;
    network: string;
    type: string;
    issuer: string | null;
  } | null;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  email: string;
  contact: string;
  notes: Record<string, string>;
  fee: number;
  tax: number;
  error_code: string | null;
  error_description: string | null;
  created_at: number;
}

interface RazorpayRefundResponse {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, string>;
  receipt: string | null;
  acquirer_data: {
    rrn: string;
  };
  created_at: number;
  batch_id: string | null;
  status: string;
  speed_processed: string;
  speed_requested: string;
}

interface RazorpayWebhookPayload {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment?: {
      entity: RazorpayPaymentResponse;
    };
    order?: {
      entity: RazorpayOrderResponse;
    };
  };
  created_at: number;
}
