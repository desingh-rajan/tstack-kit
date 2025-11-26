/**
 * Article Service
 * Extends BaseService for standard CRUD + custom methods
 */

import { BaseService } from "@/lib/base-service.ts";
import type { Article, BulkDeleteResponse } from "./article.types.ts";

export class ArticleService extends BaseService<Article> {
  constructor() {
    super("/ts-admin/articles");
  }

  /**
   * Bulk delete multiple articles (custom method)
   */
  bulkDelete(ids: number[]): Promise<BulkDeleteResponse> {
    return this.client.post<BulkDeleteResponse>(
      `${this.basePath}/bulk-delete`,
      { ids },
    );
  }
}

export const articleService = new ArticleService();
