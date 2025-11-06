import type { EntityNames } from "../utils/stringUtils.ts";

export function generateRouteTemplate(names: EntityNames): string {
  return `import { Hono } from "hono";
import { ${names.pascalSingular}Controller } from "./${names.kebabSingular}.controller.ts";

const ${names.singular}Routes = new Hono();

// All routes are public (no authentication)
${names.singular}Routes.get("/${names.kebabPlural}", ${names.pascalSingular}Controller.getAll);
${names.singular}Routes.get("/${names.kebabPlural}/:id", ${names.pascalSingular}Controller.getById);
${names.singular}Routes.post("/${names.kebabPlural}", ${names.pascalSingular}Controller.create);
${names.singular}Routes.put("/${names.kebabPlural}/:id", ${names.pascalSingular}Controller.update);
${names.singular}Routes.delete("/${names.kebabPlural}/:id", ${names.pascalSingular}Controller.delete);

export default ${names.singular}Routes;
`;
}
