/**
 * Site Settings Schemas Registry
 *
 * This file exports all site setting schemas, their TypeScript types,
 * and default values. It serves as the single source of truth for
 * system-defined settings.
 *
 * Pattern for adding new system settings:
 * 1. Create schema in appropriate category file (e.g., features.schemas.ts)
 * 2. Export schema, type, and default value
 * 3. Add to SITE_SETTING_SCHEMAS registry below
 * 4. Restart backend - auto-seeding will handle the rest!
 */

// Auto-export all schemas and types from category files
export * from "./general.schemas.ts";
export * from "./appearance.schemas.ts";
export * from "./features.schemas.ts";
export * from "./email.schemas.ts";

// Import for registry building
import {
  ApiConfigSchema,
  ContactInfoSchema,
  DEFAULT_API_CONFIG,
  DEFAULT_CONTACT_INFO,
  DEFAULT_SITE_INFO,
  SiteInfoSchema,
} from "./general.schemas.ts";
import {
  DEFAULT_THEME_CONFIG,
  ThemeConfigSchema,
} from "./appearance.schemas.ts";
import {
  DEFAULT_FEATURE_FLAGS,
  FeatureFlagsSchema,
} from "./features.schemas.ts";
import {
  DEFAULT_EMAIL_SETTINGS,
  EmailSettingsSchema,
} from "./email.schemas.ts";

/**
 * Registry of all system setting schemas
 */
export const SITE_SETTING_SCHEMAS = {
  site_info: SiteInfoSchema,
  contact_info: ContactInfoSchema,
  api_config: ApiConfigSchema,
  theme_config: ThemeConfigSchema,
  feature_flags: FeatureFlagsSchema,
  email_settings: EmailSettingsSchema,
} as const;

/**
 * Registry of all default values
 */
export const DEFAULT_SETTINGS = {
  site_info: DEFAULT_SITE_INFO,
  contact_info: DEFAULT_CONTACT_INFO,
  api_config: DEFAULT_API_CONFIG,
  theme_config: DEFAULT_THEME_CONFIG,
  feature_flags: DEFAULT_FEATURE_FLAGS,
  email_settings: DEFAULT_EMAIL_SETTINGS,
} as const;

/**
 * System setting keys (auto-derived from registry)
 */
export const SYSTEM_SETTING_KEYS = Object.keys(
  SITE_SETTING_SCHEMAS,
) as SystemSettingKey[];

export type SystemSettingKey = keyof typeof SITE_SETTING_SCHEMAS;

/**
 * Category map for auto-seeding
 */
export const CATEGORY_MAP: Record<SystemSettingKey, string> = {
  site_info: "general",
  contact_info: "general",
  api_config: "general",
  theme_config: "appearance",
  feature_flags: "features",
  email_settings: "email",
};

/**
 * Public settings list (frontend-accessible)
 */
export const PUBLIC_SETTINGS: SystemSettingKey[] = [
  "site_info",
  "contact_info",
  "theme_config",
  "feature_flags",
];
