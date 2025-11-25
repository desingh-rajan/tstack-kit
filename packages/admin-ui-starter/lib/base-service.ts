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
 * Base service that provides standard CRUD operations
 * Extend this instead of duplicating code for each entity
 */
export class BaseService<T> {
  protected client: HttpClient = apiClient;

  constructor(protected readonly basePath: string) {}

  setClient(client: HttpClient): void {
    this.client = client;
  }

  list(params?: Record<string, unknown>): Promise<ListResponse<T>> {
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
    return this.client.get<ListResponse<T>>(path);
  }

  getById(id: string | number): Promise<T> {
    return this.client.get<T>(`${this.basePath}/${id}`);
  }

  getByKey(key: string): Promise<T> {
    return this.client.get<T>(`${this.basePath}/${key}`);
  }

  create(data: Partial<T>): Promise<T> {
    return this.client.post<T>(this.basePath, data);
  }

  update(id: string | number, data: Partial<T>): Promise<T> {
    return this.client.put<T>(`${this.basePath}/${id}`, data);
  }

  delete(id: string | number): Promise<void> {
    return this.client.delete(`${this.basePath}/${id}`).then(() => undefined);
  }
}
