import type { EntityNames } from "../utils/stringUtils.ts";

export function generateRouteTemplate(names: EntityNames): string {
  return `import { Hono } from "hono";
import { ${names.pascalSingular}Controller } from "./${names.singular}.controller.ts";

const ${names.singular}Routes = new Hono();

// All routes are public (no authentication)
${names.singular}Routes.get("/${names.plural}", ${names.pascalSingular}Controller.getAll);
${names.singular}Routes.get("/${names.plural}/:id", ${names.pascalSingular}Controller.getById);
${names.singular}Routes.post("/${names.plural}", ${names.pascalSingular}Controller.create);
${names.singular}Routes.put("/${names.plural}/:id", ${names.pascalSingular}Controller.update);
${names.singular}Routes.delete("/${names.plural}/:id", ${names.pascalSingular}Controller.delete);

export default ${names.singular}Routes;
`;
}
