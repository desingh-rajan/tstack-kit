/**
 * Brand TypeScript types
 * Matches backend brand.model.ts and brand.dto.ts
 */

export interface Brand extends Record<string, unknown> {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandInput {
  name: string;
  slug?: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface UpdateBrandInput {
  name?: string;
  slug?: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  description?: string | null;
  isActive?: boolean;
}

export interface BrandListResponse {
  success: boolean;
  data: Brand[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface BrandResponse {
  success: boolean;
  data: Brand;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}
