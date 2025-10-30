import type { EntityNames } from "../utils/stringUtils.ts";

export function generateDtoTemplate(names: EntityNames): string {
  return `import { z } from "zod";

// Create ${names.pascalSingular} DTO
export const Create${names.pascalSingular}Schema = z.object({
  // TODO: Add your validation fields here
  // Example:
  // name: z.string().min(1, "Name is required"),
  // description: z.string().optional(),
  // isActive: z.boolean().default(true),
});

export type Create${names.pascalSingular}DTO = z.infer<typeof Create${names.pascalSingular}Schema>;

// Update ${names.pascalSingular} DTO
export const Update${names.pascalSingular}Schema = z.object({
  // TODO: Add your updatable fields here (all optional)
  // Example:
  // name: z.string().min(1).optional(),
  // description: z.string().optional(),
  // isActive: z.boolean().optional(),
});

export type Update${names.pascalSingular}DTO = z.infer<typeof Update${names.pascalSingular}Schema>;

// ${names.pascalSingular} Response DTO
export interface ${names.pascalSingular}ResponseDTO {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  
  // TODO: Add your response fields here
  // Example:
  // name: string;
  // description?: string | null;
  // isActive: boolean;
}
`;
}
