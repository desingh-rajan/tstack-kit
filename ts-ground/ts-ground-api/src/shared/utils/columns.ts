import { integer, timestamp } from "drizzle-orm/pg-core";

/**
 * Common timestamp columns for all tables
 * Explicitly named in snake_case for database columns
 * Using 'date' mode to return JavaScript Date objects instead of numbers
 */
export const timestamps = {
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
};

/**
 * Common ID column for all tables
 * Auto-incrementing primary key
 */
export const idColumn = {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
};

/**
 * Common columns combining ID and timestamps
 * Use this for most tables: { ...commonColumns, ...yourFields }
 */
export const commonColumns = {
  ...idColumn,
  ...timestamps,
};
