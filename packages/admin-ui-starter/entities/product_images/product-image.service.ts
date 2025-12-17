/**
 * Product Image Service
 * Handles image uploads and management
 */

import { BaseService } from "@/lib/base-service.ts";
import type { ProductImage } from "./product-image.types.ts";

export class ProductImageService extends BaseService<ProductImage> {
  constructor() {
    super("/ts-admin/product-images");
  }

  /**
   * Upload image for a product (multipart/form-data)
   */
  async uploadImage(
    productId: string,
    file: File,
    altText?: string,
    isPrimary?: boolean,
  ): Promise<{ success: boolean; data: ProductImage }> {
    const formData = new FormData();
    formData.append("file", file);
    if (altText) formData.append("altText", altText);
    if (isPrimary) formData.append("isPrimary", "true");

    const response = await fetch(`/ts-admin/products/${productId}/images`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    return response.json();
  }

  /**
   * Set image as primary
   */
  setPrimary(imageId: string): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>(
      `${this.basePath}/${imageId}/set-primary`,
      {},
    );
  }

  /**
   * Reorder images for a product
   */
  reorder(
    productId: string,
    orderedIds: string[],
  ): Promise<{ success: boolean }> {
    return this.client.put<{ success: boolean }>(
      `/ts-admin/products/${productId}/images/reorder`,
      { orderedIds },
    );
  }

  /**
   * Get images for a product
   */
  getByProductId(
    productId: string,
  ): Promise<{ success: boolean; data: ProductImage[] }> {
    return this.client.get<{ success: boolean; data: ProductImage[] }>(
      `/products/${productId}/images`,
    );
  }
}

export const productImageService = new ProductImageService();
