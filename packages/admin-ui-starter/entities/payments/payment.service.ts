/**
 * Payment Service for Admin UI
 */

import { ApiClient } from "@/lib/api.ts";
import type { RefundRequest, RefundResponse } from "./payment.types.ts";

const API_BASE_URL = typeof Deno !== "undefined"
  ? Deno.env.get("API_BASE_URL") || "http://localhost:8000"
  : "http://localhost:8000";

export class PaymentService {
  private client: ApiClient;
  private basePath = "/ts-admin/payments";

  constructor(token?: string) {
    this.client = new ApiClient(API_BASE_URL, token || null);
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
}

export const paymentService = new PaymentService();
