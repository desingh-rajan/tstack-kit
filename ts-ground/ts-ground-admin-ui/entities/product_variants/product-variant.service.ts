/**
 * Product Variant Service
 * Extends BaseService for standard CRUD + variant-specific methods
 */

import { BaseService } from "@/lib/base-service.ts";
import type {
  BulkDeleteResponse,
  ProductVariant,
} from "./product-variant.types.ts";

export class ProductVariantService extends BaseService<ProductVariant> {
  constructor() {
    super("/ts-admin/product-variants");
  }

  /**
   * Bulk delete multiple variants
   */
  bulkDelete(ids: string[]): Promise<BulkDeleteResponse> {
    return this.client.post<BulkDeleteResponse>(
      `${this.basePath}/bulk-delete`,
      { ids },
    );
  }

  /**
   * Bulk create variants for a product
   */
  bulkCreate(
    productId: string,
    variants: Array<{
      sku?: string | null;
      price?: string | number | null;
      stockQuantity?: number;
      options: Record<string, string>;
    }>,
  ): Promise<{ success: boolean; data: ProductVariant[] }> {
    return this.client.post<{ success: boolean; data: ProductVariant[] }>(
      `${this.basePath}/bulk`,
      { productId, variants },
    );
  }

  /**
   * Update stock quantity
   */
  updateStock(id: string, quantity: number): Promise<{ success: boolean }> {
    return this.client.put<{ success: boolean }>(
      `${this.basePath}/${id}/stock`,
      { quantity },
    );
  }

  /**
   * Adjust stock quantity (add/subtract)
   */
  adjustStock(id: string, adjustment: number): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>(
      `${this.basePath}/${id}/stock/adjust`,
      { adjustment },
    );
  }

  /**
   * Get variants for a product
   */
  getByProductId(
    productId: string,
  ): Promise<{ success: boolean; data: ProductVariant[] }> {
    return this.client.get<{ success: boolean; data: ProductVariant[] }>(
      `/products/${productId}/variants`,
    );
  }
}

export const productVariantService = new ProductVariantService();
