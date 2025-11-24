import type { EntityNames } from "../utils/stringUtils.ts";

export function generateAdminRouteTemplate(names: EntityNames): string {
  return `import { HonoAdminAdapter, DrizzleAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { ${names.plural} } from "./${names.kebabSingular}.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";
import { AdminRouteFactory } from "../../shared/routes/admin-route.factory.ts";

/**
 * ${names.pascalSingular} Admin Routes
 * Admin panel API at /ts-admin/${names.kebabPlural}
 * 
 * Provides full CRUD interface with:
 * - Pagination, search, sorting
 * - Role-based access control
 * - Form metadata (new/edit)
 * - Bulk operations
 */

const ADMIN_BASE_URL = "/ts-admin/${names.kebabPlural}";

const ormAdapter = new DrizzleAdapter(${names.plural}, {
  db,
  idColumn: "id",
  idType: "number",
});

const ${names.camelSingular}Admin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "${names.singular}",
  entityNamePlural: "${names.plural}",
  columns: [
    "id",
    // TODO: Add your entity columns here
    // "name",
    // "description",
    "createdAt",
    "updatedAt",
  ],
  searchable: [
    // TODO: Add searchable columns
    // "name",
    // "description",
  ],
  sortable: [
    "id",
    // TODO: Add sortable columns
    // "name",
    "createdAt",
    "updatedAt",
  ],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: ADMIN_BASE_URL,
});

const ${names.camelSingular}AdminRoutes = AdminRouteFactory.createAdminRoutes({
  baseUrl: ADMIN_BASE_URL,
  adapter: ${names.camelSingular}Admin,
  authMiddleware: [requireAuth],
  // Optional: Override specific handlers for custom logic
  // customHandlers: {
  //   update: ${names.pascalSingular}Controller.customUpdate,
  //   delete: ${names.pascalSingular}Controller.customDelete,
  // },
});

export default ${names.camelSingular}AdminRoutes;
`;
}
