/**
 * @tstack/admin - Admin CRUD system for TStack Kit
 *
 * A framework-agnostic admin interface library that provides:
 * - CRUD operations with pagination, search, and sorting
 * - Support for multiple ORMs (Drizzle, Sequelize, Prisma)
 * - Support for multiple frameworks (Hono, Express, Fastify)
 * - JSON API responses only (API-first architecture)
 * - Type-safe with full TypeScript support
 *
 * @example
 * ```typescript
 * import { HonoAdminAdapter, DrizzleAdapter } from "@tstack/admin";
 * import { products } from "./schema.ts";
 *
 * const ormAdapter = new DrizzleAdapter(products, { db });
 * const admin = new HonoAdminAdapter({
 *   ormAdapter,
 *   entityName: "product",
 *   columns: ["id", "name", "price"],
 * });
 *
 * app.get("/admin/products", admin.list());
 * ```
 *
 * @module
 */

// Core types and utilities

/**
 * Core type exports for entity management, pagination, search, and authorization.
 *
 * - `AuthUser` -- Authenticated user object passed through middleware.
 * - `EntityId` -- Numeric or string identifier for entities.
 * - `PaginationParams` -- Parameters for paginated list queries (page, limit, search, sort).
 * - `PaginationResult` -- Result wrapper returned by paginated queries.
 * - `SearchableColumn` -- Column name that supports text search.
 * - `SortableColumn` -- Column name that supports sorting.
 * - `UserRole` -- Role string for authorization checks (e.g. "admin", "superadmin").
 */
export type {
  AuthUser,
  EntityId,
  PaginationParams,
  PaginationResult,
  SearchableColumn,
  SortableColumn,
  UserRole,
} from "./src/core/types.ts";

/** Calculate offset, totalPages, hasNext/hasPrev from page + limit + totalItems. */
export {
  calculatePagination,
  type PaginationMeta,
} from "./src/core/pagination.ts";

// Slug utilities

/** Generate a URL-safe slug, ensure uniqueness against a DB, and validate format. */
export {
  ensureUniqueSlug,
  ensureUniqueSlugSync,
  generateSlug,
  isValidSlug,
} from "./src/core/slug.ts";

// ORM adapters

/** Interface that all ORM adapters must implement (list, getById, create, update, delete). */
export type { IORMAdapter } from "./src/orm/base.ts";

/** Drizzle ORM adapter providing CRUD, search, sort, and pagination. */
export { DrizzleAdapter } from "./src/orm/drizzle.ts";

// Framework adapters

/** Hono framework adapter that wires ORM operations to HTTP routes. */
export { type AdminConfig, HonoAdminAdapter } from "./src/framework/hono.ts";
