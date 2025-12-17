/**
 * Variant Option Service
 * Extends BaseService for standard CRUD
 */

import { BaseService } from "@/lib/base-service.ts";
import type {
  BulkDeleteResponse,
  VariantOption,
  VariantOptionsByType as _VariantOptionsByType,
} from "./variant-option.types.ts";

export class VariantOptionService extends BaseService<VariantOption> {
  constructor() {
    super("/ts-admin/variant-options");
  }

  /**
   * Bulk delete multiple variant options
   */
  bulkDelete(ids: string[]): Promise<BulkDeleteResponse> {
    return this.client.post<BulkDeleteResponse>(
      `${this.basePath}/bulk-delete`,
      { ids },
    );
  }

  /**
   * Reorder options within a type
   */
  reorder(type: string, orderedIds: string[]): Promise<{ success: boolean }> {
    return this.client.put<{ success: boolean }>(
      `${this.basePath}/reorder`,
      { type, orderedIds },
    );
  }
}

export const variantOptionService = new VariantOptionService();
