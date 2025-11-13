/**
 * @tstack/admin - Admin CRUD system for TStack Kit
 *
 * A framework-agnostic admin interface library that provides:
 * - CRUD operations with pagination, search, and sorting
 * - Support for multiple ORMs (Drizzle, Sequelize, Prisma)
 * - Support for multiple frameworks (Hono, Express, Fastify)
 * - HTML views with Tailwind CSS and htmx
 * - JSON API responses
 * - Type-safe with full TypeScript support
 *
 * @example
 * ```typescript
 * import { HonoAdminAdapter, DrizzleAdapter } from "@tstack/admin";
 * import { products } from "./schema.ts";
 *
 * const ormAdapter = new DrizzleAdapter(products);
 * const admin = new HonoAdminAdapter({ ormAdapter });
 *
 * app.get("/admin/products", admin.list());
 * ```
 *
 * @module
 */

// Core types and utilities
export type {
  EntityId,
  PaginationParams,
  PaginationResult,
  SearchableColumn,
  SortableColumn,
} from "./src/core/types.ts";

export {
  calculatePagination,
  type PaginationMeta,
} from "./src/core/pagination.ts";

// ORM adapters
export type { IORMAdapter } from "./src/orm/base.ts";
export { DrizzleAdapter } from "./src/orm/drizzle.ts";

// Framework adapters
export { type AdminConfig, HonoAdminAdapter } from "./src/framework/hono.ts";

// Views
export { detectResponseType } from "./src/views/negotiation.ts";
export { adminLayout } from "./src/views/layout.ts";
export { renderList } from "./src/views/list.ts";
export { renderForm } from "./src/views/form.ts";
