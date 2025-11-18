/**
 * Hono Framework Adapter
 *
 * Provides HTTP handlers for admin CRUD operations using Hono.
 * Returns JSON responses only (API-first architecture).
 */

import type { Context } from "hono";
import type { IORMAdapter } from "../orm/base.ts";
import type { AuthUser, UserRole } from "../core/types.ts";

/**
 * Admin configuration for Hono adapter
 */
export interface AdminConfig<T> {
  /** ORM adapter instance */
  ormAdapter: IORMAdapter<T>;

  /** Entity name (singular, e.g., "product") */
  entityName: string;

  /** Entity name (plural, e.g., "products") */
  entityNamePlural?: string;

  /** Columns to display in list view */
  columns: string[];

  /** Columns that are searchable */
  searchable?: string[];

  /** Columns that are sortable */
  sortable?: string[];

  /** Roles that can access admin (default: ["superadmin", "admin"]) */
  allowedRoles?: UserRole[];

  /** Base URL for admin routes (default: "/ts-admin/{entityName}") */
  baseUrl?: string;
}

/**
 * Hono Admin Adapter
 *
 * Creates HTTP handlers for admin CRUD operations.
 * All methods return JSON responses only.
 *
 * @template T - Entity type
 *
 * @example
 * ```typescript
 * const admin = new HonoAdminAdapter({
 *   ormAdapter: new DrizzleAdapter(products, { db }),
 *   entityName: "product",
 *   columns: ["id", "name", "price"],
 *   searchable: ["name"],
 *   sortable: ["id", "name", "price"],
 * });
 *
 * app.get("/admin/products", admin.list());
 * ```
 */
export class HonoAdminAdapter<T> {
  private config: Required<AdminConfig<T>>;

  constructor(config: AdminConfig<T>) {
    // Set defaults
    this.config = {
      ...config,
      entityNamePlural: config.entityNamePlural || `${config.entityName}s`,
      searchable: config.searchable || [],
      sortable: config.sortable || config.columns,
      allowedRoles: config.allowedRoles || ["superadmin", "admin"],
      baseUrl: config.baseUrl || `/ts-admin/${config.entityName}s`,
    };
  }

  /**
   * List all records with pagination, search, and sorting
   * Returns JSON only: { data: [...], meta: { total, page, perPage, totalPages } }
   *
   * Example: GET /ts-admin/products?page=1&limit=20&search=query&orderBy=name&orderDir=asc
   */
  list(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      // Check authorization
      this.checkAuth(c);

      // Parse query parameters
      const page = parseInt(c.req.query("page") || "1");
      const limit = Math.min(parseInt(c.req.query("limit") || "20"), 100); // Maximum allowed limit is 100
      const search = c.req.query("search") || "";
      const orderBy = c.req.query("orderBy");
      const orderDir = (c.req.query("orderDir") as "asc" | "desc") || "desc";

      // Fetch data from ORM
      const result = await this.config.ormAdapter.findMany({
        page,
        limit,
        search,
        searchColumns: this.config.searchable,
        orderBy,
        orderDir,
      });

      // Return JSON only
      return c.json(result);
    };
  }

  /**
   * Show a single record
   * Returns JSON only: { id, name, price, ... }
   *
   * Example: GET /ts-admin/products/:id
   */
  show(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      this.checkAuth(c);

      const id = c.req.param("id");
      const record = await this.config.ormAdapter.findById(id);

      if (!record) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json(record);
    };
  }

  /**
   * Show create form metadata (for frontends that need field info)
   * Returns JSON only: { entityName, columns, searchable, sortable }
   *
   * Example: GET /ts-admin/products/new
   */
  new(): (c: Context) => Promise<Response> {
    return (c: Context) => {
      this.checkAuth(c);

      return c.json({
        entityName: this.config.entityName,
        entityNamePlural: this.config.entityNamePlural,
        columns: this.config.columns,
        searchable: this.config.searchable,
        sortable: this.config.sortable,
        mode: "create",
      });
    };
  }

  /**
   * Create new record
   * Returns JSON only: { id, name, price, createdAt, ... }
   *
   * Example: POST /ts-admin/products
   * Body: { name: "Widget", price: 19.99 }
   */
  create(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      this.checkAuth(c);

      const body = await this.parseBody(c);

      try {
        const newRecord = await this.config.ormAdapter.create(
          body as Partial<T>,
        );

        return c.json(newRecord, 201);
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : "An error occurred";

        return c.json({ error: errorMessage }, 400);
      }
    };
  }

  /**
   * Show edit form metadata with existing record data
   * Returns JSON only: { entityName, columns, data: { id, name, ... } }
   *
   * Example: GET /ts-admin/products/:id/edit
   */
  edit(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      this.checkAuth(c);

      const id = c.req.param("id");
      const record = await this.config.ormAdapter.findById(id);

      if (!record) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({
        entityName: this.config.entityName,
        entityNamePlural: this.config.entityNamePlural,
        columns: this.config.columns,
        searchable: this.config.searchable,
        sortable: this.config.sortable,
        data: record,
        mode: "edit",
      });
    };
  }

  /**
   * Update existing record
   * Returns JSON only: { id, name, price, updatedAt, ... }
   *
   * Example: PUT/PATCH /ts-admin/products/:id
   * Body: { name: "Updated Widget", price: 24.99 }
   */
  update(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      this.checkAuth(c);

      const id = c.req.param("id");
      const body = await this.parseBody(c);

      try {
        const updated = await this.config.ormAdapter.update(
          id,
          body as Partial<T>,
        );

        if (!updated) {
          return c.json({ error: "Not found" }, 404);
        }

        return c.json(updated);
      } catch (error) {
        const errorMessage = error instanceof Error
          ? error.message
          : "An error occurred";

        return c.json({ error: errorMessage }, 400);
      }
    };
  }

  /**
   * Delete record
   * Returns JSON only: { message: "Deleted successfully" }
   *
   * Example: DELETE /ts-admin/products/:id
   */
  destroy(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      this.checkAuth(c);

      const id = c.req.param("id");
      const deleted = await this.config.ormAdapter.delete(id);

      if (!deleted) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ message: "Deleted successfully" });
    };
  }

  /**
   * Bulk delete records
   * Returns JSON only: { message: "Deleted N records", count: N }
   *
   * Example: POST /ts-admin/products/bulk-delete
   * Body: { ids: [1, 2, 3] }
   */
  bulkDelete(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      this.checkAuth(c);

      const body = await c.req.json();
      const ids = body.ids || [];

      if (!Array.isArray(ids) || ids.length === 0) {
        return c.json({ error: "No IDs provided" }, 400);
      }

      const deletedCount = await this.config.ormAdapter.bulkDelete(ids);

      return c.json({
        message: `Deleted ${deletedCount} records`,
        count: deletedCount,
      });
    };
  }

  /**
   * Check if user is authorized
   */
  private checkAuth(c: Context): void {
    const user = c.get("user") as AuthUser | undefined;

    if (!user) {
      throw new Error("Unauthorized: Authentication required");
    }

    if (!this.config.allowedRoles.includes(user.role)) {
      throw new Error(
        `Forbidden: Requires one of: ${this.config.allowedRoles.join(", ")}`,
      );
    }
  }

  /**
   * Parse request body (handles both JSON and form data)
   */
  // deno-lint-ignore no-explicit-any
  private async parseBody(c: Context): Promise<Record<string, any>> {
    const contentType = c.req.header("Content-Type") || "";

    if (contentType.includes("application/json")) {
      return await c.req.json();
    }

    // Parse form data (for flexibility with form submissions)
    const formData = await c.req.formData();
    // deno-lint-ignore no-explicit-any
    const body: Record<string, any> = {};

    for (const [key, value] of formData.entries()) {
      // Skip _method field (used for PUT/PATCH/DELETE emulation)
      if (key === "_method") continue;

      // Convert checkbox values
      if (value === "true") {
        body[key] = true;
      } else if (value === "false") {
        body[key] = false;
      } else {
        body[key] = value;
      }
    }

    return body;
  }
}
