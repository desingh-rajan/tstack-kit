/**
 * Hono Framework Adapter
 *
 * Provides HTTP handlers for admin CRUD operations using Hono.
 */

import type { Context } from "hono";
import type { IORMAdapter } from "../orm/base.ts";
import type { AuthUser, UserRole, ViewConfig } from "../core/types.ts";
import { detectResponseType } from "../views/negotiation.ts";
import { adminLayout } from "../views/layout.ts";
import { renderList } from "../views/list.ts";
import { renderForm } from "../views/form.ts";

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
  private viewConfig: ViewConfig;

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

    this.viewConfig = {
      entityName: this.config.entityName,
      entityNamePlural: this.config.entityNamePlural,
      columns: this.config.columns,
      searchable: this.config.searchable,
      sortable: this.config.sortable,
      baseUrl: this.config.baseUrl,
    };
  }

  /**
   * List all records with pagination, search, and sorting
   * Example: GET /ts-admin/products?page=1&limit=20&search=query&orderBy=name&orderDir=asc
   * (baseUrl is configurable)
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

      // Detect response type
      const responseType = detectResponseType(c);

      if (responseType === "json") {
        return c.json(result);
      }

      // Render HTML (full page or htmx partial)
      const listHtml = renderList({
        result,
        config: this.viewConfig,
        currentSearch: search,
        currentOrderBy: orderBy,
        currentOrderDir: orderDir,
      });

      if (responseType === "htmx") {
        // Return just the table for htmx requests
        return c.html(listHtml);
      }

      // Full HTML page
      const user = c.get("user") as AuthUser | undefined;
      const fullHtml = adminLayout(listHtml, {
        title: this.config.entityNamePlural,
        config: this.viewConfig,
        currentUser: user ? { email: user.email, role: user.role } : undefined,
      });

      return c.html(fullHtml);
    };
  }

  /**
   * Show a single record
   * Example: GET /ts-admin/products/:id
   * (baseUrl is configurable)
   */
  show(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      this.checkAuth(c);

      const id = c.req.param("id");
      const record = await this.config.ormAdapter.findById(id);

      if (!record) {
        return c.json({ error: "Not found" }, 404);
      }

      const responseType = detectResponseType(c);

      if (responseType === "json") {
        return c.json(record);
      }

      // Render HTML view (implement detail view if needed)
      const detailHtml = `
        <div class="bg-white rounded-lg shadow p-6">
          <pre>${JSON.stringify(record, null, 2)}</pre>
          <div class="mt-4 space-x-2">
            <a href="${this.config.baseUrl}/${id}/edit" class="text-blue-600 hover:text-blue-800">Edit</a>
            <a href="${this.config.baseUrl}" class="text-gray-600 hover:text-gray-800">Back to List</a>
          </div>
        </div>
      `;

      const user = c.get("user") as AuthUser | undefined;
      const fullHtml = adminLayout(detailHtml, {
        title: `${this.config.entityName} #${id}`,
        config: this.viewConfig,
        currentUser: user ? { email: user.email, role: user.role } : undefined,
      });

      return c.html(fullHtml);
    };
  }

  /**
   * Show create form
   * Example: GET /ts-admin/products/new
   * (baseUrl is configurable)
   */
  new(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      this.checkAuth(c);

      const formHtml = renderForm({
        config: this.viewConfig,
        mode: "create",
      });

      const responseType = detectResponseType(c);
      if (responseType === "json") {
        return c.json({ message: "Use POST to create" });
      }

      const user = c.get("user") as AuthUser | undefined;
      const fullHtml = adminLayout(formHtml, {
        title: `New ${this.config.entityName}`,
        config: this.viewConfig,
        currentUser: user ? { email: user.email, role: user.role } : undefined,
      });

      return c.html(fullHtml);
    };
  }

  /**
   * Create new record
   * Example: POST /ts-admin/products
   * (baseUrl is configurable)
   */
  create(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      this.checkAuth(c);

      const body = await this.parseBody(c);

      try {
        const newRecord = await this.config.ormAdapter.create(
          body as Partial<T>,
        );

        const responseType = detectResponseType(c);
        if (responseType === "json") {
          return c.json(newRecord, 201);
        }

        // Redirect to list on success
        return c.redirect(this.config.baseUrl);
      } catch (error) {
        const responseType = detectResponseType(c);
        const errorMessage = error instanceof Error
          ? error.message
          : "An error occurred";

        if (responseType === "json") {
          return c.json({ error: errorMessage }, 400);
        }

        // Re-render form with errors
        const formHtml = renderForm({
          config: this.viewConfig,
          data: body,
          errors: { _error: errorMessage },
          mode: "create",
        });

        const user = c.get("user") as AuthUser | undefined;
        const fullHtml = adminLayout(formHtml, {
          title: `New ${this.config.entityName}`,
          config: this.viewConfig,
          currentUser: user
            ? { email: user.email, role: user.role }
            : undefined,
        });

        return c.html(fullHtml, 400);
      }
    };
  }

  /**
   * Show edit form
   * Example: GET /ts-admin/products/:id/edit
   * (baseUrl is configurable)
   */
  edit(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      this.checkAuth(c);

      const id = c.req.param("id");
      const record = await this.config.ormAdapter.findById(id);

      if (!record) {
        return c.json({ error: "Not found" }, 404);
      }

      const formHtml = renderForm({
        config: this.viewConfig,
        data: record as Record<string, any>,
        mode: "edit",
      });

      const user = c.get("user") as AuthUser | undefined;
      const fullHtml = adminLayout(formHtml, {
        title: `Edit ${this.config.entityName}`,
        config: this.viewConfig,
        currentUser: user ? { email: user.email, role: user.role } : undefined,
      });

      return c.html(fullHtml);
    };
  }

  /**
   * Update existing record
   * PUT/PATCH /admin/products/:id
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

        const responseType = detectResponseType(c);
        if (responseType === "json") {
          return c.json(updated);
        }

        // Redirect to list on success
        return c.redirect(this.config.baseUrl);
      } catch (error) {
        const responseType = detectResponseType(c);
        const errorMessage = error instanceof Error
          ? error.message
          : "An error occurred";

        if (responseType === "json") {
          return c.json({ error: errorMessage }, 400);
        }

        // Re-render form with errors
        const formHtml = renderForm({
          config: this.viewConfig,
          data: body,
          errors: { _error: errorMessage },
          mode: "edit",
        });

        const user = c.get("user") as AuthUser | undefined;
        const fullHtml = adminLayout(formHtml, {
          title: `Edit ${this.config.entityName}`,
          config: this.viewConfig,
          currentUser: user
            ? { email: user.email, role: user.role }
            : undefined,
        });

        return c.html(fullHtml, 400);
      }
    };
  }

  /**
   * Delete record
   * Example: DELETE /ts-admin/products/:id
   * (baseUrl is configurable)
   */
  destroy(): (c: Context) => Promise<Response> {
    return async (c: Context) => {
      this.checkAuth(c);

      const id = c.req.param("id");
      const deleted = await this.config.ormAdapter.delete(id);

      if (!deleted) {
        return c.json({ error: "Not found" }, 404);
      }

      const responseType = detectResponseType(c);
      if (responseType === "json") {
        return c.json({ message: "Deleted successfully" });
      }

      // For htmx, return empty response to remove row
      return c.body(null, 200);
    };
  }

  /**
   * Bulk delete records
   * Example: POST /ts-admin/products/bulk-delete
   * (baseUrl is configurable)
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
  private async parseBody(c: Context): Promise<Record<string, any>> {
    const contentType = c.req.header("Content-Type") || "";

    if (contentType.includes("application/json")) {
      return await c.req.json();
    }

    // Parse form data
    const formData = await c.req.formData();
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
