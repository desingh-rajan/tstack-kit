import type { EntityNames } from "../utils/stringUtils.ts";

export function generateAdminRouteTemplate(names: EntityNames): string {
  return `import { Hono } from "hono";
import { HonoAdminAdapter, DrizzleAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { ${names.plural} } from "./${names.kebabSingular}.model.ts";

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
  baseUrl: "/ts-admin/${names.kebabPlural}",
});

// Register admin routes (requires authentication)
const ${names.singular}AdminRoutes = new Hono();

${names.singular}AdminRoutes.get("/", ${names.singular}Admin.list());
${names.singular}AdminRoutes.get("/new", ${names.singular}Admin.new());
${names.singular}AdminRoutes.post("/", ${names.singular}Admin.create());
${names.singular}AdminRoutes.get("/:id", ${names.singular}Admin.show());
${names.singular}AdminRoutes.get("/:id/edit", ${names.singular}Admin.edit());
${names.singular}AdminRoutes.put("/:id", ${names.singular}Admin.update());
${names.singular}AdminRoutes.patch("/:id", ${names.singular}Admin.update());
${names.singular}AdminRoutes.delete("/:id", ${names.singular}Admin.destroy());
${names.singular}AdminRoutes.post("/bulk-delete", ${names.singular}Admin.bulkDelete());

export default ${names.singular}AdminRoutes;
`;
}
