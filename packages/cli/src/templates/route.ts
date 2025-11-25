import type { EntityNames } from "../utils/stringUtils.ts";

export function generateRouteTemplate(
  names: EntityNames,
): string {
  return `import { BaseRouteFactory } from "../../shared/routes/base-route.factory.ts";
import { ${names.pascalSingular}ControllerStatic } from "./${names.kebabSingular}.controller.ts";
import { Create${names.pascalSingular}Schema, Update${names.pascalSingular}Schema } from "./${names.kebabSingular}.dto.ts";
// import { requireAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * ${names.pascalSingular} Routes
 * 
 * Configure your routes:
 * - publicRoutes: ["getAll", "getById"] - No auth required
 * - middleware.auth: requireAuth - Protect create/update/delete
 */

const ${names.singular}Routes = BaseRouteFactory.createCrudRoutes({
  basePath: "/${names.kebabPlural}",
  controller: ${names.pascalSingular}ControllerStatic,
  schemas: {
    create: Create${names.pascalSingular}Schema,
    update: Update${names.pascalSingular}Schema,
  },
  // All routes public by default - uncomment to add auth:
  // publicRoutes: ["getAll", "getById"],
  // middleware: {
  //   auth: requireAuth,
  // },
});

export default ${names.singular}Routes;
`;
}
