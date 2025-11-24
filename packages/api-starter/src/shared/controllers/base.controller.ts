import { Context } from "hono";
import { ApiResponse } from "../utils/response.ts";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../utils/errors.ts";

/**
 * Authorization configuration for controller methods
 */
export interface AuthConfig {
  /**
   * Roles allowed to access this method (e.g., ['superadmin', 'admin'])
   * If not set, any authenticated user can access
   */
  roles?: string[];

  /**
   * Check if user owns the resource (for update/delete)
   * Receives (entity, userId) and returns true if user owns it
   */
  ownershipCheck?: (entity: any, userId: number) => boolean;

  /**
   * Custom authorization logic
   * Receives (context, entity) and throws error if unauthorized
   */
  customCheck?: (c: Context, entity?: any) => Promise<void> | void;
}

/**
 * Base Controller Class with Rails-style declarative authentication
 *
 * Provides standard CRUD HTTP handlers for all entities.
 * Eliminates 70-80% of boilerplate code across controllers.
 *
 * @template ServiceType - The service class type
 *
 * @example Simple controller (no auth):
 * ```typescript
 * export class ArticleController extends BaseController<typeof articleService> {
 *   constructor() {
 *     super(articleService, "Article");
 *   }
 * }
 * ```
 *
 * @example Controller with ownership checks:
 * ```typescript
 * export class ArticleController extends BaseController<typeof articleService> {
 *   constructor() {
 *     super(articleService, "Article", {
 *       update: { ownershipCheck: (article, userId) => article.authorId === userId },
 *       delete: { ownershipCheck: (article, userId) => article.authorId === userId },
 *     });
 *   }
 * }
 * ```
 *
 * @example Controller with role-based access:
 * ```typescript
 * export class UserController extends BaseController<typeof userService> {
 *   constructor() {
 *     super(userService, "User", {
 *       delete: { roles: ['superadmin'] },
 *       update: { roles: ['superadmin', 'admin'] },
 *     });
 *   }
 * }
 * ```
 */
export abstract class BaseController<
  ServiceType extends {
    getAll: () => Promise<any[]>;
    getById: (id: number) => Promise<any | null>;
    create: (data: any) => Promise<any>;
    update: (id: number, data: any) => Promise<any | null>;
    delete: (id: number) => Promise<boolean>;
  },
> {
  protected authConfig: {
    create?: AuthConfig;
    update?: AuthConfig;
    delete?: AuthConfig;
  } = {};

  constructor(
    protected service: ServiceType,
    protected entityName: string,
    authConfig?: {
      create?: AuthConfig;
      update?: AuthConfig;
      delete?: AuthConfig;
    },
  ) {
    if (authConfig) {
      this.authConfig = authConfig;
    }
  }

  /**
   * GET /entities
   * List all records
   */
  getAll = async (c: Context) => {
    const entities = await this.service.getAll();
    return c.json(
      ApiResponse.success(
        entities,
        `${this.entityName}s retrieved successfully`,
      ),
      200,
    );
  };

  /**
   * GET /entities/:id
   * Get a single record by ID
   */
  getById = async (c: Context) => {
    const id = this.parseId(c);
    const entity = await this.service.getById(id);

    if (!entity) {
      throw new NotFoundError(`${this.entityName} not found`);
    }

    return c.json(
      ApiResponse.success(entity, `${this.entityName} retrieved successfully`),
      200,
    );
  };

  /**
   * POST /entities
   * Create a new record
   */
  create = async (c: Context) => {
    // Check authentication and authorization
    await this.checkAuth(c, "create");

    // Get validated data from middleware (set by validate() middleware)
    const validatedData = c.get("validatedData");
    const entity = await this.service.create(validatedData);

    return c.json(
      ApiResponse.success(entity, `${this.entityName} created successfully`),
      201,
    );
  };

  /**
   * PUT /entities/:id
   * Update an existing record
   */
  update = async (c: Context) => {
    const id = this.parseId(c);

    // Fetch entity first for ownership check
    const entity = await this.service.getById(id);
    if (!entity) {
      throw new NotFoundError(`${this.entityName} not found`);
    }

    // Check authentication and authorization (with entity for ownership check)
    await this.checkAuth(c, "update", entity);

    // Get validated data from middleware (set by validate() middleware)
    const validatedData = c.get("validatedData");
    const updatedEntity = await this.service.update(id, validatedData);

    if (!updatedEntity) {
      throw new NotFoundError(`${this.entityName} not found`);
    }

    return c.json(
      ApiResponse.success(
        updatedEntity,
        `${this.entityName} updated successfully`,
      ),
      200,
    );
  };

  /**
   * DELETE /entities/:id
   * Delete a record
   */
  delete = async (c: Context) => {
    const id = this.parseId(c);

    // Fetch entity first for ownership check
    const entity = await this.service.getById(id);
    if (!entity) {
      throw new NotFoundError(`${this.entityName} not found`);
    }

    // Check authentication and authorization (with entity for ownership check)
    await this.checkAuth(c, "delete", entity);

    const success = await this.service.delete(id);

    if (!success) {
      throw new NotFoundError(`${this.entityName} not found`);
    }

    return c.json(
      ApiResponse.success(null, `${this.entityName} deleted successfully`),
      200,
    );
  };

  // ============================================================================
  // Authorization Helper Methods
  // ============================================================================

  /**
   * Check authentication and authorization for a method
   * Applies role checks, ownership checks, and custom checks
   */
  protected async checkAuth(
    c: Context,
    method: "create" | "update" | "delete",
    entity?: unknown,
  ): Promise<void> {
    const config = this.authConfig[method];

    // If no auth config, skip checks (public endpoint)
    if (!config) {
      return;
    }

    // Get user from context (set by requireAuth middleware)
    const user = c.get("user");

    if (!user) {
      throw new ForbiddenError("Authentication required");
    }

    // 1. Role-based check
    if (config.roles && config.roles.length > 0) {
      const hasRole = config.roles.includes(user.role);
      const isSuperadmin = user.role === "superadmin"; // Superadmin bypasses role checks

      if (!hasRole && !isSuperadmin) {
        throw new ForbiddenError(
          `Access denied. Required role: ${config.roles.join(" or ")}`,
        );
      }
    }

    // 2. Ownership check (for update/delete)
    if (config.ownershipCheck && entity) {
      const isOwner = config.ownershipCheck(entity, user.id);
      const isSuperadmin = user.role === "superadmin"; // Superadmin bypasses ownership

      if (!isOwner && !isSuperadmin) {
        throw new ForbiddenError(
          `You don't have permission to ${method} this ${this.entityName}`,
        );
      }
    }

    // 3. Custom authorization check
    if (config.customCheck) {
      await config.customCheck(c, entity);
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Parse and validate ID parameter from route
   */
  protected parseId(c: Context): number {
    const id = parseInt(c.req.param("id"));

    if (isNaN(id) || id <= 0) {
      throw new BadRequestError("Invalid ID format");
    }

    return id;
  }

  // ============================================================================
  // Static Export Helper (DRY pattern)
  // ============================================================================

  /**
   * Generate static export object for routes
   * Use this to avoid repeating controller method exports
   *
   * @example
   * ```typescript
   * const controller = new ArticleController();
   * export const ArticleControllerStatic = controller.toStatic();
   * ```
   */
  toStatic() {
    return {
      getAll: this.getAll,
      getById: this.getById,
      create: this.create,
      update: this.update,
      delete: this.delete,
    };
  }
}
