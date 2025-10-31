import { Context } from "hono";
import { ArticleService } from "./article.service.ts";
import { ValidationUtil } from "../../shared/utils/validation.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../shared/utils/errors.ts";
import { CreateArticleSchema, UpdateArticleSchema } from "./article.dto.ts";

/**
 * Article Controller - Reference Implementation
 *
 * Demonstrates:
 * 1. Public routes (getAll, getById) - No auth check
 * 2. Protected routes (create, update, delete) - Auth required via requireAuth middleware
 * 3. Authorization checks - Users can only modify their own articles (except superadmin)
 * 4. Role-based access - superadmin can edit any article, regular users only their own
 * 5. Using c.get('user') to get authenticated user info (includes role)
 * 6. Proper HTTP status codes (401, 403, 404)
 *
 * Role System:
 * - superadmin: Full access (system-defined, cannot be created via API)
 * - admin: Can be created by superadmin (use for future admin features)
 * - moderator: Can be created by superadmin (use for content moderation)
 * - user: Default role for all registered users
 */

export class ArticleController {
  // GET /api/articles - PUBLIC ROUTE
  static async getAll(c: Context) {
    const articles = await ArticleService.getAll();
    return c.json(
      ApiResponse.success(
        { data: articles },
        "Articles retrieved successfully",
      ),
      200,
    );
  }

  // GET /api/articles/:id - PUBLIC ROUTE
  static async getById(c: Context) {
    const id = parseInt(c.req.param("id"));
    const article = await ArticleService.getById(id);

    if (!article) {
      throw new NotFoundError("Article not found");
    }

    return c.json(
      ApiResponse.success(article, "Article retrieved successfully"),
      200,
    );
  }

  // POST /api/articles - PROTECTED ROUTE (requireAuth middleware)
  static async create(c: Context) {
    const user = c.get("user");

    if (!user) {
      throw new BadRequestError("User not authenticated");
    }

    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(
      CreateArticleSchema,
      body,
    );

    // Ensure isPublished has a value
    const articleData = {
      ...validatedData,
      isPublished: validatedData.isPublished ?? false,
    };

    const article = await ArticleService.create(articleData, user.id);

    return c.json(
      ApiResponse.success(article, "Article created successfully"),
      201,
    );
  } // PUT /api/articles/:id - PROTECTED ROUTE (requireAuth middleware)
  static async update(c: Context) {
    const id = parseInt(c.req.param("id"));
    const user = c.get("user");

    if (!user) {
      throw new BadRequestError("User not authenticated");
    }

    const existingArticle = await ArticleService.getById(id);
    if (!existingArticle) {
      throw new NotFoundError("Article not found");
    }

    // AUTHORIZATION: Only author or superadmin can update
    const isSuperadmin = user.role === "superadmin";
    const isAuthor = existingArticle.authorId === user.id;

    if (!isAuthor && !isSuperadmin) {
      throw new ForbiddenError(
        "You don't have permission to update this article",
      );
    }

    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(
      UpdateArticleSchema,
      body,
    );

    const article = await ArticleService.update(id, validatedData);

    if (!article) {
      throw new NotFoundError("Article not found");
    }

    return c.json(
      ApiResponse.success(article, "Article updated successfully"),
      200,
    );
  }

  // DELETE /api/articles/:id - PROTECTED ROUTE (requireAuth middleware)
  static async delete(c: Context) {
    const id = parseInt(c.req.param("id"));
    const user = c.get("user");

    if (!user) {
      throw new BadRequestError("User not authenticated");
    }

    const existingArticle = await ArticleService.getById(id);
    if (!existingArticle) {
      throw new NotFoundError("Article not found");
    }

    // AUTHORIZATION: Only author or superadmin can delete
    const isSuperadmin = user.role === "superadmin";
    const isAuthor = existingArticle.authorId === user.id;

    if (!isAuthor && !isSuperadmin) {
      throw new ForbiddenError(
        "You don't have permission to delete this article",
      );
    }

    const success = await ArticleService.delete(id);

    if (!success) {
      throw new NotFoundError("Article not found");
    }

    return c.json(
      ApiResponse.success(null, "Article deleted successfully"),
      200,
    );
  }
}
