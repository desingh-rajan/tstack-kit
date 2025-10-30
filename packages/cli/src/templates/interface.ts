import type { EntityNames } from "../utils/stringUtils.ts";

export function generateInterfaceTemplate(names: EntityNames): string {
  return `// Base interface for ${names.pascalSingular} entity
export interface ${names.pascalSingular} {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  
  // TODO: Add your custom fields here
  // Example:
  // name: string;
  // description?: string | null;
  // isActive: boolean;
}

// Interface for creating new ${names.pascalSingular} (without auto-generated fields)
export interface Create${names.pascalSingular} {
  // TODO: Add your required fields for creation
  // Example:
  // name: string;
  // description?: string;
}

// Interface for updating ${names.pascalSingular} (all fields optional except constraints)
export interface Update${names.pascalSingular} {
  // TODO: Add your updatable fields
  // Example:
  // name?: string;
  // description?: string;
  // isActive?: boolean;
}

// Interface for ${names.pascalSingular} with relations (if needed)
export interface ${names.pascalSingular}WithRelations extends ${names.pascalSingular} {
  // TODO: Add related entities here when you have relations
  // Example:
  // author?: User;
  // comments?: Comment[];
}
`;
}
