/**
 * Product Image TypeScript types
 * Matches backend product-image.model.ts and product-image.dto.ts
 */

export interface ProductImage extends Record<string, unknown> {
  id: string;
  productId: string;
  url: string;
  thumbnailUrl?: string | null;
  altText?: string | null;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface CreateProductImageInput {
  productId: string;
  url: string;
  thumbnailUrl?: string | null;
  altText?: string | null;
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface UpdateProductImageInput {
  url?: string;
  thumbnailUrl?: string | null;
  altText?: string | null;
  displayOrder?: number;
  isPrimary?: boolean;
}

export interface ProductImageListResponse {
  success: boolean;
  data: ProductImage[];
}

export interface ProductImageResponse {
  success: boolean;
  data: ProductImage;
}
