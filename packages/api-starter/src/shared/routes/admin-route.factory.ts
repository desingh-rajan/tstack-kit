import { Hono } from "hono";
import type { MiddlewareHandler } from "hono";
import type { HonoAdminAdapter } from "@tstack/admin";

export interface AdminRouteConfig {
  baseUrl: string;
  adapter: HonoAdminAdapter<unknown>;
  authMiddleware?: MiddlewareHandler[];
  /**
   * Optional custom handlers to override default adapter methods.
   * Use this when you need custom business logic (validation, authorization, etc.)
   * that the adapter doesn't provide.
   *
   * Example: Prevent deletion of system settings
   * ```typescript
   * customHandlers: {
   *   update: SiteSettingController.update,  // Custom validation
   *   delete: SiteSettingController.delete,  // Prevent system setting deletion
   * }
   * ```
   */
  customHandlers?: {
    list?: MiddlewareHandler;
    show?: MiddlewareHandler;
    create?: MiddlewareHandler;
    update?: MiddlewareHandler;
    delete?: MiddlewareHandler;
  };
}

export class AdminRouteFactory {
  static createAdminRoutes(config: AdminRouteConfig): Hono {
    const routes = new Hono();
    const { baseUrl, adapter, authMiddleware = [], customHandlers = {} } =
      config;

    // Apply auth middleware to all admin routes
    if (authMiddleware.length > 0) {
      routes.use(`${baseUrl}/*`, ...authMiddleware);
      routes.use(baseUrl, ...authMiddleware);
    }

    // CRUD routes - use custom handlers if provided, otherwise use adapter methods
    // Note: Custom handlers are registered BEFORE adapter methods to ensure they take precedence
    routes.get(baseUrl, customHandlers.list || adapter.list());
    routes.get(`${baseUrl}/new`, adapter.new());
    routes.post(baseUrl, customHandlers.create || adapter.create());
    routes.get(`${baseUrl}/:id`, customHandlers.show || adapter.show());
    routes.get(`${baseUrl}/:id/edit`, adapter.edit());
    routes.put(`${baseUrl}/:id`, customHandlers.update || adapter.update());
    routes.patch(`${baseUrl}/:id`, customHandlers.update || adapter.update());
    routes.delete(`${baseUrl}/:id`, customHandlers.delete || adapter.destroy());
    routes.post(`${baseUrl}/bulk-delete`, adapter.bulkDelete());

    return routes;
  }
}
