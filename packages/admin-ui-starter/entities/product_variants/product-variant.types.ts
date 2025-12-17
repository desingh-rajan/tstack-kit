/**
 * Product Variant TypeScript types
 * Matches backend product-variant.model.ts and product-variant.dto.ts
 */

export interface ProductVariant extends Record<string, unknown> {
  id: string;
  productId: string;
  sku?: string | null;
  price?: string | null;
  compareAtPrice?: string | null;
  stockQuantity: number;
  options: Record<string, string>; // e.g., {"size": "10 inch", "finish": "Pre-seasoned"}
  imageId?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Populated from join
  image?: { id: string; url: string; thumbnailUrl?: string | null } | null;
}

export interface CreateProductVariantInput {
  productId: string;
  sku?: string | null;
  price?: string | number | null;
  compareAtPrice?: string | number | null;
  stockQuantity?: number;
  options: Record<string, string>;
  imageId?: string | null;
  isActive?: boolean;
}

export interface UpdateProductVariantInput {
  sku?: string | null;
  price?: string | number | null;
  compareAtPrice?: string | number | null;
  stockQuantity?: number;
  options?: Record<string, string>;
  imageId?: string | null;
  isActive?: boolean;
}

export interface ProductVariantListResponse {
  success: boolean;
  data: ProductVariant[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductVariantResponse {
  success: boolean;
  data: ProductVariant;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}
