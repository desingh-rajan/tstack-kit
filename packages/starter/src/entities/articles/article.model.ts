import { integer, pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
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
  isPublished: integer("is_published").default(0).notNull(), // 0 = draft, 1 = published

  // Foreign key to users table (author)
  authorId: integer("author_id").references(() => users.id).notNull(),
});

// Type inference from schema
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;

// Zod schemas for validation
export const insertArticleSchema = createInsertSchema(articles);
export const selectArticleSchema = createSelectSchema(articles);
