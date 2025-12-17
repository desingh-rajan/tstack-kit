/**
 * Category Service
 * Extends BaseService for standard CRUD + hierarchical methods
 */

import { BaseService } from "@/lib/base-service.ts";
import type { BulkDeleteResponse, Category } from "./category.types.ts";

export class CategoryService extends BaseService<Category> {
  constructor() {
    super("/ts-admin/categories");
  }

  /**
   * Bulk delete multiple categories
   */
  bulkDelete(ids: string[]): Promise<BulkDeleteResponse> {
    return this.client.post<BulkDeleteResponse>(
      `${this.basePath}/bulk-delete`,
      { ids },
    );
  }

  /**
   * Reorder categories
   */
  reorder(orderedIds: string[]): Promise<{ success: boolean }> {
    return this.client.put<{ success: boolean }>(
      `${this.basePath}/reorder`,
      { orderedIds },
    );
  }
}

export const categoryService = new CategoryService();
