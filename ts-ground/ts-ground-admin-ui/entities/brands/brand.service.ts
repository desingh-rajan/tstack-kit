/**
 * Brand Service
 * Extends BaseService for standard CRUD
 */

import { BaseService } from "@/lib/base-service.ts";
import type { Brand, BulkDeleteResponse } from "./brand.types.ts";

export class BrandService extends BaseService<Brand> {
  constructor() {
    super("/ts-admin/brands");
  }

  /**
   * Bulk delete multiple brands
   */
  bulkDelete(ids: string[]): Promise<BulkDeleteResponse> {
    return this.client.post<BulkDeleteResponse>(
      `${this.basePath}/bulk-delete`,
      { ids },
    );
  }
}

export const brandService = new BrandService();
