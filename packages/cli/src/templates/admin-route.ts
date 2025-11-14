import type { EntityNames } from "../utils/stringUtils.ts";

export function generateAdminRouteTemplate(names: EntityNames): string {
  return `import { Hono } from "hono";
import { HonoAdminAdapter, DrizzleAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { ${names.plural} } from "./${names.kebabSingular}.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

// Admin base URL constant
const ADMIN_BASE_URL = "/ts-admin/${names.kebabPlural}";

// Create ORM adapter for ${names.singular}
const ormAdapter = new DrizzleAdapter(${names.plural}, {
  db,
  idColumn: "id",
  idType: "number", // Change to "string" if using UUID
});

// Create admin adapter with CRUD configuration
const ${names.singular}Admin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "${names.singular}",
  entityNamePlural: "${names.plural}",
  columns: ["id", "createdAt", "updatedAt"], // TODO: Add your entity columns
  searchable: [], // TODO: Add searchable columns (e.g., ["name", "description"])
  sortable: ["id", "createdAt", "updatedAt"], // TODO: Add sortable columns
  allowedRoles: ["superadmin", "admin"], // Only superadmin and admin can access
  baseUrl: ADMIN_BASE_URL,
});

// Register admin routes (requires authentication)
const ${names.singular}AdminRoutes = new Hono();

// Apply authentication middleware to all admin routes
${names.singular}AdminRoutes.use(\`\${ADMIN_BASE_URL}/*\`, requireAuth);
${names.singular}AdminRoutes.use(ADMIN_BASE_URL, requireAuth);

// CRUD routes
${names.singular}AdminRoutes.get(ADMIN_BASE_URL, ${names.singular}Admin.list());
${names.singular}AdminRoutes.get(\`\${ADMIN_BASE_URL}/new\`, ${names.singular}Admin.new());
${names.singular}AdminRoutes.post(ADMIN_BASE_URL, ${names.singular}Admin.create());
${names.singular}AdminRoutes.get(\`\${ADMIN_BASE_URL}/:id\`, ${names.singular}Admin.show());
${names.singular}AdminRoutes.get(\`\${ADMIN_BASE_URL}/:id/edit\`, ${names.singular}Admin.edit());
${names.singular}AdminRoutes.put(\`\${ADMIN_BASE_URL}/:id\`, ${names.singular}Admin.update());
${names.singular}AdminRoutes.patch(\`\${ADMIN_BASE_URL}/:id\`, ${names.singular}Admin.update());
${names.singular}AdminRoutes.delete(\`\${ADMIN_BASE_URL}/:id\`, ${names.singular}Admin.destroy());
${names.singular}AdminRoutes.post(\`\${ADMIN_BASE_URL}/bulk-delete\`, ${names.singular}Admin.bulkDelete());

export default ${names.singular}AdminRoutes;
`;
}
