import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import type { ZodSchema } from "zod";
import { validate } from "../middleware/validate.ts";

export interface CrudRouteConfig {
  basePath: string;
  controller: {
    getAll: MiddlewareHandler;
    getById: MiddlewareHandler;
    create: MiddlewareHandler;
    update: MiddlewareHandler;
    delete: MiddlewareHandler;
  };
  schemas?: {
    create?: ZodSchema;
    update?: ZodSchema;
  };
  publicRoutes?: ("getAll" | "getById")[];
  /**
   * Routes to disable (not register at all).
   * By default, all CRUD routes are enabled.
   *
   * Example: Hide listing endpoint from public API
   * ```typescript
   * disabledRoutes: ["getAll"]  // /articles won't be registered
   * ```
   *
   * Example: Read-only API (no mutations)
   * ```typescript
   * disabledRoutes: ["create", "update", "delete"]
   * ```
   */
  disabledRoutes?: ("getAll" | "getById" | "create" | "update" | "delete")[];
  middleware?: {
    auth?: MiddlewareHandler;
    role?: MiddlewareHandler;
    custom?: MiddlewareHandler[];
  };
}

export class BaseRouteFactory {
  static createCrudRoutes(config: CrudRouteConfig): Hono {
    const routes = new Hono();
    const {
      basePath,
      controller,
      schemas,
      publicRoutes = [],
      disabledRoutes = [],
      middleware = {},
    } = config;

    // Build middleware chain for protected routes
    const authMiddleware = [];
    if (middleware.auth) authMiddleware.push(middleware.auth);
    if (middleware.role) authMiddleware.push(middleware.role);
    if (middleware.custom) authMiddleware.push(...middleware.custom);

    // Helper to check if route is enabled
    const isEnabled = (route: string) => !disabledRoutes.includes(route as any);

    // GET ALL - public or protected (only if enabled)
    if (isEnabled("getAll")) {
      if (publicRoutes.includes("getAll")) {
        routes.get(basePath, controller.getAll);
      } else {
        routes.get(basePath, ...authMiddleware, controller.getAll);
      }
    }

    // GET BY ID - public or protected (only if enabled)
    if (isEnabled("getById")) {
      if (publicRoutes.includes("getById")) {
        routes.get(`${basePath}/:id`, controller.getById);
      } else {
        routes.get(`${basePath}/:id`, ...authMiddleware, controller.getById);
      }
    }

    // CREATE (only if enabled)
    if (isEnabled("create") && schemas?.create) {
      routes.post(
        basePath,
        ...authMiddleware,
        validate(schemas.create),
        controller.create,
      );
    }

    // UPDATE (only if enabled)
    if (isEnabled("update") && schemas?.update) {
      routes.put(
        `${basePath}/:id`,
        ...authMiddleware,
        validate(schemas.update),
        controller.update,
      );
    }

    // DELETE (only if enabled)
    if (isEnabled("delete")) {
      routes.delete(`${basePath}/:id`, ...authMiddleware, controller.delete);
    }

    return routes;
  }
}
