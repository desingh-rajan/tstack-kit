/**
 * Category TypeScript types
 * Matches backend category.model.ts and category.dto.ts
 */

export interface Category extends Record<string, unknown> {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  icon?: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // For hierarchical display
  children?: Category[];
  parent?: Category;
}

export interface CreateCategoryInput {
  name: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  icon?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
  icon?: string | null;
  displayOrder?: number;
  isActive?: boolean;
}

export interface CategoryListResponse {
  success: boolean;
  data: Category[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface CategoryResponse {
  success: boolean;
  data: Category;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}
