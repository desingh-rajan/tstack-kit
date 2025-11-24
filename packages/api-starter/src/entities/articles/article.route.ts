import { BaseRouteFactory } from "../../shared/routes/base-route.factory.ts";
import { ArticleControllerStatic } from "./article.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { CreateArticleSchema, UpdateArticleSchema } from "./article.dto.ts";

/**
 * Article Routes
 * Public: GET /articles, GET /articles/:id
 * Protected: POST, PUT, DELETE
 */

const articleRoutes = BaseRouteFactory.createCrudRoutes({
  basePath: "/articles",
  controller: ArticleControllerStatic,
  schemas: {
    create: CreateArticleSchema,
    update: UpdateArticleSchema,
  },
  publicRoutes: ["getAll", "getById"],
  middleware: {
    auth: requireAuth,
  },
});

export default articleRoutes;
