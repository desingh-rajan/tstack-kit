import type { EntityNames } from "../utils/stringUtils.ts";

export function generateControllerTemplate(
  names: EntityNames,
): string {
  return `import { ${names.camelSingular}Service } from "./${names.kebabSingular}.service.ts";
import { BaseController } from "../../shared/controllers/base.controller.ts";

/**
 * ${names.pascalSingular} Controller
 * 
 * Extends BaseController to inherit standard CRUD handlers:
 * - getAll(), getById(), create(), update(), delete()
 * 
 * Configure authorization declaratively in constructor:
 * - roles: ['superadmin', 'admin'] - who can access
 * - ownershipCheck: (entity, userId) => entity.userId === userId
 * 
 * Override methods to add custom logic when needed.
 */

export class ${names.pascalSingular}Controller extends BaseController<typeof ${names.camelSingular}Service> {
  constructor() {
    super(
      ${names.camelSingular}Service,
      "${names.pascalSingular}",
      // Optional: Configure authorization
      // {
      //   create: { roles: ["user"] },
      //   update: { ownershipCheck: (${names.singular}, userId) => ${names.singular}.userId === userId },
      //   delete: { ownershipCheck: (${names.singular}, userId) => ${names.singular}.userId === userId },
      // }
    );
  }

  // Override methods here if needed
  // Example: Custom create logic
  // override create = async (c: Context) => { ... }
}

const controller = new ${names.pascalSingular}Controller();
export const ${names.pascalSingular}ControllerStatic = controller.toStatic();
`;
}
