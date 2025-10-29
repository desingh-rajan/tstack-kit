import type { EntityNames } from "../utils/stringUtils.ts";

export function generateModelTemplate(names: EntityNames): string {
  return `import { integer, text, timestamp, boolean, pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const ${names.plural} = pgTable("${names.tableName}", {
 id: integer().primaryKey().generatedAlwaysAsIdentity(),
 name: text().notNull(),
 description: text(),
 isActive: boolean().default(true).notNull(),
 createdAt: timestamp().defaultNow().notNull(),
 updatedAt: timestamp().defaultNow().notNull(),
});

// Type inference from schema
export type ${names.pascalSingular} = typeof ${names.plural}.$inferSelect;
export type New${names.pascalSingular} = typeof ${names.plural}.$inferInsert;

// Zod schemas for validation
export const insert${names.pascalSingular}Schema = createInsertSchema(${names.plural}, {
 name: (schema) => schema.name.min(1, "Name is required"),
});

export const select${names.pascalSingular}Schema = createSelectSchema(${names.plural});
`;
}
