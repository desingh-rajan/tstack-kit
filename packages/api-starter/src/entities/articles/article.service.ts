import { eq, getTableColumns } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { users } from "../../auth/user.model.ts";
import { BadRequestError } from "../../shared/utils/errors.ts";
import { BaseService } from "../../shared/services/base.service.ts";
import { generateSlug } from "@tstack/admin";
import type {
  ArticleResponseDTO,
  CreateArticleDTO,
  UpdateArticleDTO,
} from "./article.dto.ts";
import type { Article } from "./article.model.ts";

/**
 * Article Service - Extends BaseService
 *
 * Only contains entity-specific logic:
 * - Custom joins (author information)
 * - Slug generation and validation
 * - Published articles filtering
 *
 * All standard CRUD operations inherited from BaseService.
 */

export class ArticleService extends BaseService<
  Article,
  CreateArticleDTO,
  UpdateArticleDTO,
  ArticleResponseDTO
> {
  constructor() {
    super(db, articles);
  }

  /**
   * Override: Get all published articles with author information
   */
  override async getAll(): Promise<ArticleResponseDTO[]> {
    const result = await db
      .select({
        ...getTableColumns(articles),
        authorName: users.username,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.isPublished, true));

    return result.map((row) => ({
      ...row,
      authorName: row.authorName ?? undefined,
      isPublished: row.isPublished,
    }));
  }

  /**
   * Override: Get article by ID with author information
   */
  override async getById(id: number): Promise<ArticleResponseDTO | null> {
    const result = await db
      .select({
        ...getTableColumns(articles),
        authorName: users.username,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return {
      ...result[0],
      authorName: result[0].authorName ?? undefined,
      isPublished: result[0].isPublished,
    };
  }

  /**
   * Custom method: Create article with authenticated user as author
   */
  async createWithAuthor(
    data: CreateArticleDTO,
    authorId: number,
  ): Promise<ArticleResponseDTO> {
    const slug = data.slug || generateSlug(data.title);

    const existing = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestError(`Article with slug "${slug}" already exists`);
    }

    const [newRecord] = await db
      .insert(articles)
      .values({
        title: data.title,
        slug,
        content: data.content || null,
        excerpt: data.excerpt || null,
        isPublished: data.isPublished ?? false,
        authorId,
      })
      .returning();

    return {
      ...newRecord,
      authorName: undefined,
      isPublished: newRecord.isPublished,
    };
  }
}

export const articleService = new ArticleService();
