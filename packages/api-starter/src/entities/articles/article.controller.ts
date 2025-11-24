import { Context } from "hono";
import { articleService } from "./article.service.ts";
import { BaseController } from "../../shared/controllers/base.controller.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import { BadRequestError } from "../../shared/utils/errors.ts";

/**
 * Article Controller - Extends BaseController
 *
 * Declarative auth configuration:
 * - getAll, getById: Public (no auth)
 * - create: Any authenticated user
 * - update, delete: Only article author (or superadmin)
 */

export class ArticleController extends BaseController<typeof articleService> {
  constructor() {
    super(articleService, "Article", {
      update: {
        ownershipCheck: (article, userId) => article.authorId === userId,
      },
      delete: {
        ownershipCheck: (article, userId) => article.authorId === userId,
      },
    });
  }

  /**
   * Override: Inject authenticated user's ID as authorId
   */
  override create = async (c: Context) => {
    const user = c.get("user");
    if (!user) {
      throw new BadRequestError("User not authenticated");
    }

    const validatedData = c.get("validatedData");
    const article = await articleService.createWithAuthor(
      validatedData,
      user.id,
    );

    return c.json(
      ApiResponse.success(article, "Article created successfully"),
      201,
    );
  };
}

const controller = new ArticleController();
export const ArticleControllerStatic = controller.toStatic();
