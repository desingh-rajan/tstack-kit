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
export type {
  AuthUser,
  EntityId,
  PaginationParams,
  PaginationResult,
  SearchableColumn,
  SortableColumn,
  UserRole,
} from "./src/core/types.ts";

export {
  calculatePagination,
  type PaginationMeta,
} from "./src/core/pagination.ts";

// Slug utilities
export {
  ensureUniqueSlug,
  ensureUniqueSlugSync,
  generateSlug,
  isValidSlug,
} from "./src/core/slug.ts";

// ORM adapters
export type { IORMAdapter } from "./src/orm/base.ts";
export { DrizzleAdapter } from "./src/orm/drizzle.ts";

// Framework adapters
export { type AdminConfig, HonoAdminAdapter } from "./src/framework/hono.ts";
