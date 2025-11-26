/**
 * Article TypeScript types
 * Matches backend article.model.ts and article.dto.ts
 */

export interface Article extends Record<string, unknown> {
  id: number;
  title: string;
  slug: string;
  content?: string | null;
  excerpt?: string | null;
  isPublished: boolean;
  authorId: number;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArticleInput {
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  isPublished?: boolean;
}

export interface UpdateArticleInput {
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string | null;
  isPublished?: boolean;
}

export interface ArticleListResponse {
  success: boolean;
  data: Article[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ArticleResponse {
  success: boolean;
  data: Article;
}

export interface DeleteArticleResponse {
  success: boolean;
  message: string;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}
