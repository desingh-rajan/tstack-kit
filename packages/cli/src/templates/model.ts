import type { EntityNames } from "../utils/stringUtils.ts";

export function generateModelTemplate(names: EntityNames): string {
  return `import { integer, timestamp, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
// Import additional column types as needed:
// import { text, boolean, real, jsonb, varchar } from "drizzle-orm/pg-core";

export const ${names.plural} = pgTable("${names.tableName}", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  
  // TODO: Add your custom fields here
  // Example:
  // name: text().notNull(),
  // description: text(),
  // isActive: boolean().default(true),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type inference from schema
export type ${names.pascalSingular} = typeof ${names.plural}.$inferSelect;
export type New${names.pascalSingular} = typeof ${names.plural}.$inferInsert;

// Zod schemas for validation
export const insert${names.pascalSingular}Schema = createInsertSchema(${names.plural});
export const select${names.pascalSingular}Schema = createSelectSchema(${names.plural});
`;
}
