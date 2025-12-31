import { timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * Common columns for UUID-based tables (used by product listing entities)
 *
 * Uses gen_random_uuid() for automatic UUID generation
 */
export const uuidColumn = {
  id: uuid("id").primaryKey().defaultRandom(),
};

export const uuidTimestamps = {
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" })
    .defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" })
    .defaultNow().notNull(),
};

export const commonUuidColumns = {
  ...uuidColumn,
  ...uuidTimestamps,
};
