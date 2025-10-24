import type { EntityNames } from "../utils/stringUtils.ts";

export function generateModelTemplate(names: EntityNames): string {
  return `import { int, text, sqliteTable } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const ${names.plural} = sqliteTable("${names.tableName}", {
 id: int().primaryKey({ autoIncrement: true }),
 name: text().notNull(),
 description: text(),
 isActive: int({ mode: "boolean" }).default(true).notNull(),
 createdAt: int().notNull(),
 updatedAt: int().notNull(),
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
