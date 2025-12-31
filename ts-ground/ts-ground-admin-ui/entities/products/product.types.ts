/**
 * Product TypeScript types
 * Matches backend product.model.ts and product.dto.ts
 */

export interface Product extends Record<string, unknown> {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  brandId?: string | null;
  categoryId?: string | null;
  specifications?: Record<string, unknown>;
  price: string;
  compareAtPrice?: string | null;
  sku?: string | null;
  stockQuantity: number;
  isActive: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated from joins
  brand?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  // Primary image (from product_images with isPrimary=true)
  primaryImage?: {
    id: string;
    url: string;
    thumbnailUrl?: string | null;
    altText?: string | null;
  } | null;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string | null;
  brandId?: string | null;
  categoryId?: string | null;
  specifications?: Record<string, unknown>;
  price: string | number;
  compareAtPrice?: string | number | null;
  sku?: string | null;
  stockQuantity?: number;
  isActive?: boolean;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string | null;
  brandId?: string | null;
  categoryId?: string | null;
  specifications?: Record<string, unknown>;
  price?: string | number;
  compareAtPrice?: string | number | null;
  sku?: string | null;
  stockQuantity?: number;
  isActive?: boolean;
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProductResponse {
  success: boolean;
  data: Product;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}
