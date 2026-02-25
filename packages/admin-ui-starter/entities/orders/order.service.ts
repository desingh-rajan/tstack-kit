/**
 * Order Service for Admin UI
 * Custom service for order-specific operations
 */

import { ApiClient } from "@/lib/api.ts";
import type {
  Order,
  OrderListResponse,
  UpdateOrderStatusRequest,
} from "./order.types.ts";

// Use internal Docker URL for SSR to avoid public URL roundtrip
const API_INTERNAL_URL = typeof Deno !== "undefined"
  ? Deno.env.get("API_INTERNAL_URL")
  : undefined;
const API_BASE_URL = typeof Deno !== "undefined"
  ? Deno.env.get("API_BASE_URL") || "http://localhost:8000"
  : "http://localhost:8000";
const SSR_API_URL = API_INTERNAL_URL || API_BASE_URL;

export class OrderService {
  private client: ApiClient;
  private basePath = "/ts-admin/orders";

  constructor(token?: string) {
    this.client = new ApiClient(SSR_API_URL, token || null);
  }

  setToken(token: string | null): void {
    this.client.setToken(token);
  }

  /**
   * List all orders with filters
   */
  list(params?: {
    page?: number;
    pageSize?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OrderListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    const effectivePageSize = params?.pageSize ?? params?.limit;
    if (effectivePageSize) {
      searchParams.set("pageSize", String(effectivePageSize));
    }
    if (params?.status) searchParams.set("status", params.status);
    if (params?.paymentStatus) {
      searchParams.set("paymentStatus", params.paymentStatus);
    }
    if (params?.search) searchParams.set("search", params.search);
    if (params?.startDate) searchParams.set("startDate", params.startDate);
    if (params?.endDate) searchParams.set("endDate", params.endDate);

    const query = searchParams.toString();
    const path = query ? `${this.basePath}?${query}` : this.basePath;

    return this.client.get<OrderListResponse>(path);
  }

  /**
   * Get order by ID with items
   */
  getById(id: string): Promise<{ success: boolean; data: Order }> {
    return this.client.get<{ success: boolean; data: Order }>(
      `${this.basePath}/${id}`,
    );
  }

  /**
   * Update order status
   */
  updateStatus(
    id: string,
    data: UpdateOrderStatusRequest,
  ): Promise<{ success: boolean; data: Order }> {
    return this.client.put<{ success: boolean; data: Order }>(
      `${this.basePath}/${id}/status`,
      data,
    );
  }
}

export const orderService = new OrderService();
