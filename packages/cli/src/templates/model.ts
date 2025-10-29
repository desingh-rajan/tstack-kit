import type { EntityNames } from "../utils/stringUtils.ts";

export function generateModelTemplate(names: EntityNames): string {
  return `import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { commonColumns } from "../../shared/utils/columns.ts";
// Import additional column types as needed:
// import { text, boolean, integer, real, jsonb, varchar } from "drizzle-orm/pg-core";

export const ${names.plural} = pgTable("${names.tableName}", {
  ...commonColumns,
  
  // TODO: Add your custom fields here
  // Example: Use camelCase in code, but specify snake_case for DB column name
  // name: text("name").notNull(),
  // description: text("description"),
  // isActive: boolean("is_active").default(true).notNull(),
});

// Type inference from schema
export type ${names.pascalSingular} = typeof ${names.plural}.$inferSelect;
export type New${names.pascalSingular} = typeof ${names.plural}.$inferInsert;

// Zod schemas for validation
export const insert${names.pascalSingular}Schema = createInsertSchema(${names.plural});
export const select${names.pascalSingular}Schema = createSelectSchema(${names.plural});
`;
}
