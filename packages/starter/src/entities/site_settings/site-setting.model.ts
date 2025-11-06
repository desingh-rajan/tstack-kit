import { boolean, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { commonColumns } from "../../shared/utils/columns.ts";
import { users } from "../../auth/user.model.ts";

/**
 * Site Settings Table
 * Stores site-wide configuration as key-value pairs with JSONB values
 * Supports public (frontend-accessible) and private (backend-only) settings
 */
export const siteSettings = pgTable("site_settings", {
  ...commonColumns,

  // Unique key identifier (e.g., 'site_info', 'contact_info', 'smtp_config')
  key: text("key").notNull().unique(),

  // Category for organization (e.g., 'general', 'email', 'appearance', 'features')
  category: text("category").notNull(),

  // The actual configuration data stored as JSON
  value: jsonb("value").notNull(),

  // Whether this setting can be accessed by frontend (public API)
  isPublic: boolean("is_public").default(false).notNull(),

  // Human-readable description of what this setting controls
  description: text("description"),

  // Audit trail - who last updated this setting
  updatedBy: integer("updated_by").references(() => users.id),
});

// Type inference from schema
export type SiteSetting = typeof siteSettings.$inferSelect;
export type NewSiteSetting = typeof siteSettings.$inferInsert;

// Zod schemas for validation
export const insertSiteSettingSchema = createInsertSchema(siteSettings);
export const selectSiteSettingSchema = createSelectSchema(siteSettings);

/**
 * Common setting categories
 */
export const SETTING_CATEGORIES = {
  GENERAL: "general",
  EMAIL: "email",
  APPEARANCE: "appearance",
  FEATURES: "features",
  SECTIONS: "sections",
  SHOWCASE: "showcase",
} as const;

export type SettingCategory =
  typeof SETTING_CATEGORIES[keyof typeof SETTING_CATEGORIES];
