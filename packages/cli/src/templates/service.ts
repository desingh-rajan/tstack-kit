import type { EntityNames } from "../utils/stringUtils.ts";

export function generateServiceTemplate(names: EntityNames): string {
  return `import { db } from "../../config/database.ts";
import { ${names.plural} } from "./${names.kebabSingular}.model.ts";
import { BaseService } from "../../shared/services/base.service.ts";
import type {
  ${names.pascalSingular},
  Create${names.pascalSingular}DTO,
  Update${names.pascalSingular}DTO,
  ${names.pascalSingular}ResponseDTO,
} from "./${names.kebabSingular}.dto.ts";

/**
 * ${names.pascalSingular} Service
 * 
 * Extends BaseService to inherit standard CRUD operations:
 * - getAll(), getById(), create(), update(), delete()
 * - Pagination, filtering, batch operations
 * 
 * Override methods to add custom logic:
 * - Custom queries (joins, filters)
 * - Validation (beforeCreate, beforeUpdate hooks)
 * - Business logic (slug generation, etc.)
 */

export class ${names.pascalSingular}Service extends BaseService<
  ${names.pascalSingular},
  Create${names.pascalSingular}DTO,
  Update${names.pascalSingular}DTO,
  ${names.pascalSingular}ResponseDTO
> {
  constructor() {
    super(db, ${names.plural});
  }

  // Add custom methods here
  // Example: Override getAll() to add filters, joins, etc.
  // override async getAll() { ... }
  
  // Example: Use lifecycle hooks for validation
  // protected override async beforeCreate(data: Create${names.pascalSingular}DTO) {
  //   // Custom validation or transformation
  //   return data;
  // }
}

export const ${names.camelSingular}Service = new ${names.pascalSingular}Service();
`;
}
