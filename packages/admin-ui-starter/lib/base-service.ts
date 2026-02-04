/**
 * Base CRUD Service
 * All entity services extend this to eliminate duplication
 */

import { apiClient } from "@/lib/api.ts";
import type { HttpClient } from "@/lib/admin/types.ts";

export interface ListResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API Response wrapper format from backend
 * Backend returns: { status: "success", data: ..., pagination?: ... }
 */
interface ApiResponse<T> {
  status: string;
  data: T;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Base service that provides standard CRUD operations
 * Extend this instead of duplicating code for each entity
 */
export class BaseService<T> {
  protected client: HttpClient = apiClient;

  constructor(protected readonly basePath: string) {}

  setClient(client: HttpClient): void {
    this.client = client;
  }

  async list(params?: Record<string, unknown>): Promise<ListResponse<T>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      });
    }

    const query = searchParams.toString();
    const path = query ? `${this.basePath}?${query}` : this.basePath;
    const response = await this.client.get<ApiResponse<T[]>>(path);

    // Handle multiple API response formats:
    // 1. Nested: { status, data: [...], pagination: { page, pageSize, total, totalPages } }
    // 2. Flat: { status, data: [...], page, pageSize, total, totalPages }
    // 3. No pagination: { status, data: [...] } - calculate from data length
    const dataArray = response.data || [];
    const dataLength = Array.isArray(dataArray) ? dataArray.length : 0;
    const requestedPageSize = (params?.pageSize as number) ||
      (params?.limit as number) || 10;

    // Extract pagination from nested or flat format
    const paginationData = response.pagination || {
      page: (response as unknown as Record<string, unknown>).page as number ||
        1,
      pageSize:
        (response as unknown as Record<string, unknown>).pageSize as number ||
        (response as unknown as Record<string, unknown>).limit as number ||
        requestedPageSize,
      total: (response as unknown as Record<string, unknown>).total as number ||
        dataLength,
      totalPages:
        (response as unknown as Record<string, unknown>).totalPages as number ||
        Math.ceil(dataLength / requestedPageSize) || 1,
    };

    return {
      success: response.status === "success" || Array.isArray(response.data),
      data: dataArray,
      pagination: {
        page: paginationData.page || 1,
        pageSize: paginationData.pageSize ||
          (paginationData as unknown as { limit?: number }).limit ||
          requestedPageSize,
        total: paginationData.total || dataLength,
        totalPages: paginationData.totalPages ||
          Math.ceil(dataLength / requestedPageSize) || 1,
      },
    };
  }

  async getById(id: string | number): Promise<T> {
    const response = await this.client.get<ApiResponse<T> | T>(
      `${this.basePath}/${id}`,
    );
    // Handle both wrapped { status, data } and unwrapped responses
    if (
      response && typeof response === "object" && "status" in response &&
      "data" in response
    ) {
      return (response as ApiResponse<T>).data;
    }
    return response as T;
  }

  async getByKey(key: string): Promise<T> {
    const response = await this.client.get<ApiResponse<T> | T>(
      `${this.basePath}/${key}`,
    );
    // Handle both wrapped { status, data } and unwrapped responses
    if (
      response && typeof response === "object" && "status" in response &&
      "data" in response
    ) {
      return (response as ApiResponse<T>).data;
    }
    return response as T;
  }

  async create(data: Partial<T>): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(
      this.basePath,
      data,
    );
    return response.data;
  }

  async update(id: string | number, data: Partial<T>): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(
      `${this.basePath}/${id}`,
      data,
    );
    return response.data;
  }

  async delete(id: string | number): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}`);
  }
}
