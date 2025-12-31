/**
 * Variant Option TypeScript types
 * Matches backend variant-option.model.ts and variant-option.dto.ts
 */

export interface VariantOption extends Record<string, unknown> {
  id: string;
  name: string;
  type: string; // "size", "color", "finish", etc.
  displayOrder: number;
  createdAt: string;
}

export interface CreateVariantOptionInput {
  name: string;
  type: string;
  displayOrder?: number;
}

export interface UpdateVariantOptionInput {
  name?: string;
  type?: string;
  displayOrder?: number;
}

export interface VariantOptionListResponse {
  success: boolean;
  data: VariantOption[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface VariantOptionResponse {
  success: boolean;
  data: VariantOption;
}

export interface VariantOptionsByType {
  type: string;
  options: VariantOption[];
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}
