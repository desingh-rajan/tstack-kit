import { boolean, integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { commonColumns } from "../../shared/utils/columns.ts";
import { users } from "../../auth/user.model.ts";

/**
 * Articles Table - Reference Example
 *
 * This is a complete reference implementation showing:
 * - Custom fields (title, content, slug)
 * - Foreign key relationship (authorId → users)
 * - Boolean flag (isPublished)
 * - Both camelCase (code) and snake_case (DB) naming
 */
export const articles = pgTable("articles", {
  ...commonColumns,

  // Article fields
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  content: text("content"),
  excerpt: text("excerpt"),
  isPublished: boolean("is_published").default(false).notNull(), // Boolean: true = published, false = draft

  // Foreign key to users table (author)
  authorId: integer("author_id").references(() => users.id).notNull(),
});

// Type inference from schema
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
