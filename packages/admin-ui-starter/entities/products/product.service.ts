/**
 * Product Service
 * Extends BaseService for standard CRUD + product-specific methods
 */

import { BaseService } from "@/lib/base-service.ts";
import type { BulkDeleteResponse, Product } from "./product.types.ts";

export class ProductService extends BaseService<Product> {
  constructor() {
    super("/ts-admin/products");
  }

  /**
   * Bulk delete multiple products
   */
  bulkDelete(ids: string[]): Promise<BulkDeleteResponse> {
    return this.client.post<BulkDeleteResponse>(
      `${this.basePath}/bulk-delete`,
      { ids },
    );
  }

  /**
   * Soft delete a product
   */
  softDelete(id: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(
      `${this.basePath}/${id}/soft`,
    );
  }

  /**
   * Restore a soft-deleted product
   */
  restore(id: string): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>(
      `${this.basePath}/${id}/restore`,
      {},
    );
  }
}

export const productService = new ProductService();
