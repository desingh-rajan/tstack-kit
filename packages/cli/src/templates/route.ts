import type { EntityNames } from "../utils/stringUtils.ts";

export function generateRouteTemplate(names: EntityNames): string {
  return `import { Hono } from "hono";
import { ${names.pascalSingular}Controller } from "./${names.singular}.controller.ts";
import { requireAuth, requireRole } from "../../shared/middleware/auth.ts";

const ${names.singular}Routes = new Hono();

// Public routes (adjust as needed)
${names.singular}Routes.get("/${names.plural}", ${names.pascalSingular}Controller.getAll);
${names.singular}Routes.get("/${names.plural}/:id", ${names.pascalSingular}Controller.getById);

// Protected routes (uncomment if authentication is needed)
// ${names.singular}Routes.post("/${names.plural}", requireAuth, ${names.pascalSingular}Controller.create);
// ${names.singular}Routes.put("/${names.plural}/:id", requireAuth, ${names.pascalSingular}Controller.update);
// ${names.singular}Routes.delete("/${names.plural}/:id", requireAuth, requireRole(["admin"]), ${names.pascalSingular}Controller.delete);

// Or keep them public for now
${names.singular}Routes.post("/${names.plural}", ${names.pascalSingular}Controller.create);
${names.singular}Routes.put("/${names.plural}/:id", ${names.pascalSingular}Controller.update);
${names.singular}Routes.delete("/${names.plural}/:id", ${names.pascalSingular}Controller.delete);

export default ${names.singular}Routes;
`;
}
