/**
 * Payment Service for Admin UI
 */

import { ApiClient } from "@/lib/api.ts";
import type {
  ManualRefundRequest,
  RefundRequest,
  RefundResponse,
} from "./payment.types.ts";

// Use internal Docker URL for SSR to avoid public URL roundtrip
const API_INTERNAL_URL = typeof Deno !== "undefined"
  ? Deno.env.get("API_INTERNAL_URL")
  : undefined;
const API_BASE_URL = typeof Deno !== "undefined"
  ? Deno.env.get("API_BASE_URL") || "http://localhost:8000"
  : "http://localhost:8000";
const SSR_API_URL = API_INTERNAL_URL || API_BASE_URL;

export class PaymentService {
  private client: ApiClient;
  private basePath = "/ts-admin/payments";

  constructor(token?: string) {
    this.client = new ApiClient(SSR_API_URL, token || null);
  }

  setToken(token: string | null): void {
    this.client.setToken(token);
  }

  /**
   * Process refund for an order
   */
  refund(
    orderId: string,
    data?: RefundRequest,
  ): Promise<{ success: boolean; data: RefundResponse }> {
    return this.client.post<{ success: boolean; data: RefundResponse }>(
      `${this.basePath}/${orderId}/refund`,
      data || {},
    );
  }

  /**
   * Process manual refund (COD/UPI) with transaction reference
   */
  manualRefund(
    orderId: string,
    data: ManualRefundRequest,
  ): Promise<{ success: boolean; data: RefundResponse }> {
    return this.client.post<{ success: boolean; data: RefundResponse }>(
      `${this.basePath}/${orderId}/manual-refund`,
      data,
    );
  }
}

export const paymentService = new PaymentService();
