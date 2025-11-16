import { eq } from "drizzle-orm";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { users } from "../../auth/user.model.ts";
import { BadRequestError } from "../../shared/utils/errors.ts";
import type {
  ArticleResponseDTO,
  CreateArticleDTO,
  UpdateArticleDTO,
} from "./article.dto.ts";

/**
 * Article Service - Reference Implementation
 *
 * Demonstrates:
 * - CRUD operations with Drizzle ORM
 * - Slug generation from title
 * - Foreign key handling (authorId)
 * - Join queries (author info)
 * - Error handling patterns
 */

export class ArticleService {
  // Get all published articles (public route)
  static async getAll(): Promise<ArticleResponseDTO[]> {
    const result = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        excerpt: articles.excerpt,
        isPublished: articles.isPublished,
        authorId: articles.authorId,
        authorName: users.username,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
      })
      .from(articles)
      .leftJoin(users, eq(articles.authorId, users.id))
      .where(eq(articles.isPublished, true)); // Only published

    return result.map((row) => ({
      ...row,
      authorName: row.authorName ?? undefined,
      isPublished: row.isPublished, // Already boolean
    }));
  }

  // Get article by ID (public route)
  static async getById(id: number): Promise<ArticleResponseDTO | null> {
    const result = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        content: articles.content,
        excerpt: articles.excerpt,
        isPublished: articles.isPublished,
        authorId: articles.authorId,
        authorName: users.username,
        createdAt: articles.createdAt,
        updatedAt: articles.updatedAt,
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
      isPublished: result[0].isPublished, // Already boolean
    };
  }

  // Create new article (protected route)
  static async create(
    data: CreateArticleDTO,
    authorId: number,
  ): Promise<ArticleResponseDTO> {
    // Generate slug from title if not provided
    const slug = data.slug || this.generateSlug(data.title);

    // Check if slug already exists
    const existing = await db
      .select()
      .from(articles)
      .where(eq(articles.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      throw new BadRequestError(`Article with slug "${slug}" already exists`);
    }

    const newRecord = await db
      .insert(articles)
      .values({
        title: data.title,
        slug,
        content: data.content || null,
        excerpt: data.excerpt || null,
        isPublished: data.isPublished ?? false, // Boolean directly
        authorId,
      })
      .returning();

    return {
      ...newRecord[0],
      authorName: undefined,
      isPublished: newRecord[0].isPublished, // Already boolean
    };
  }

  // Helper: Generate URL-friendly slug from title
  private static generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-"); // Replace multiple hyphens with single
  }

  // Update article (protected route)
  static async update(
    id: number,
    data: UpdateArticleDTO,
  ): Promise<ArticleResponseDTO | null> {
    // Build update data with proper type conversions
    const updateData: {
      title?: string;
      slug?: string;
      content?: string;
      excerpt?: string;
      isPublished?: boolean;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.excerpt !== undefined) updateData.excerpt = data.excerpt;
    if (data.isPublished !== undefined) {
      updateData.isPublished = data.isPublished; // Boolean directly
    }

    const updated = await db
      .update(articles)
      .set(updateData)
      .where(eq(articles.id, id))
      .returning();

    if (updated.length === 0) {
      return null;
    }

    return {
      ...updated[0],
      authorName: undefined,
      isPublished: updated[0].isPublished, // Already boolean
    };
  }

  // Delete article (hard delete)
  static async delete(id: number): Promise<boolean> {
    const deleted = await db
      .delete(articles)
      .where(eq(articles.id, id))
      .returning();

    return deleted.length > 0;
  }
}
