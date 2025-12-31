/**
 * Backend Site Settings Schemas (Replicated from blog-v1)
 *
 * IMPORTANT: This file is a replica of blog-v1/src/entities/site_settings/schemas/
 * Keep in sync when backend schemas change!
 *
 * Source: blog-v1/src/entities/site_settings/schemas/
 * Last Synced: November 20, 2025
 *
 * Usage:
 * - Type-safe access to site settings structure
 * - Auto-generation of form fields (Phase 2)
 * - Runtime validation and defaults
 */

// ============================================================================
// GENERAL CATEGORY
// ============================================================================

/**
 * Site Info Schema
 * Basic site information displayed in header and meta tags
 */
export interface SiteInfo {
  siteName: string;
  tagline: string;
  description: string;
  logo: string;
  favicon: string;
}

export const DEFAULT_SITE_INFO: SiteInfo = {
  siteName: "My Application",
  tagline: "Building amazing things",
  description: "A modern web application built with TStack",
  logo: "/assets/logo.svg",
  favicon: "/assets/favicon.ico",
};

/**
 * Contact Info Schema
 * Contact information and social media links
 */
export interface SocialMedia {
  twitter?: string;
  linkedin?: string;
  github?: string;
}

export interface ContactInfo {
  email: string;
  phone?: string;
  address?: string;
  socialMedia?: SocialMedia;
}

export const DEFAULT_CONTACT_INFO: ContactInfo = {
  email: "hello@example.com",
  phone: "+1 (555) 123-4567",
  address: "123 Main Street, City, State 12345",
  socialMedia: {
    twitter: "https://twitter.com/yourhandle",
    linkedin: "https://linkedin.com/company/yourcompany",
    github: "https://github.com/yourorg",
  },
};

/**
 * API Config Schema
 * API configuration settings (private - backend only)
 */
export interface RateLimit {
  enabled: boolean;
  maxRequests: number;
  windowMs: number;
}

export interface CorsConfig {
  allowedOrigins: string[];
}

export interface ApiConfig {
  rateLimit: RateLimit;
  cors: CorsConfig;
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  rateLimit: {
    enabled: true,
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },
  cors: {
    allowedOrigins: ["http://localhost:3000"],
  },
};

// ============================================================================
// APPEARANCE CATEGORY
// ============================================================================

/**
 * Theme Config Schema
 * UI theme and color configuration
 */
export interface ThemeConfig {
  darkMode?: boolean;
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  fontFamily?: string;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  darkMode: false,
  primaryColor: "#3b82f6",
  secondaryColor: "#8b5cf6",
  accentColor: "#ec4899",
  fontFamily: "Inter, sans-serif",
};

// ============================================================================
// FEATURES CATEGORY
// ============================================================================

/**
 * Feature Flags Schema
 * Feature toggle flags for the application
 */
export interface FeatureFlags {
  enableContactForm: boolean;
  enableNewsletter: boolean;
  enableBlog: boolean;
  enableComments: boolean;
  maintenanceMode: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableContactForm: true,
  enableNewsletter: true,
  enableBlog: true,
  enableComments: false,
  maintenanceMode: false,
};

// ============================================================================
// EMAIL CATEGORY
// ============================================================================

/**
 * Email Settings Schema
 * SMTP and email configuration
 */
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  username?: string;
  password?: string;
}

export interface EmailSettings {
  smtp: SmtpConfig;
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
}

export const DEFAULT_EMAIL_SETTINGS: EmailSettings = {
  smtp: {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    username: "your-email@gmail.com",
    password: "your-app-password",
  },
  fromEmail: "noreply@example.com",
  fromName: "My Application",
  replyTo: "support@example.com",
};

// ============================================================================
// REGISTRY & TYPES
// ============================================================================

/**
 * All system setting schemas
 */
export const SITE_SETTING_SCHEMAS = {
  site_info: { __type: "SiteInfo" as const },
  contact_info: { __type: "ContactInfo" as const },
  api_config: { __type: "ApiConfig" as const },
  theme_config: { __type: "ThemeConfig" as const },
  feature_flags: { __type: "FeatureFlags" as const },
  email_settings: { __type: "EmailSettings" as const },
} as const;

/**
 * All default values
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
 * Category map for grouping settings
 */
export const CATEGORY_MAP: Record<SystemSettingKey, string> = {
  site_info: "general",
  contact_info: "general",
  api_config: "general",
  theme_config: "appearance",
  feature_flags: "features",
  email_settings: "email",
} as const;

/**
 * Public settings list (frontend-accessible without auth)
 */
export const PUBLIC_SETTINGS: SystemSettingKey[] = [
  "site_info",
  "contact_info",
  "theme_config",
  "feature_flags",
];

/**
 * Private settings list (backend only)
 */
export const PRIVATE_SETTINGS: SystemSettingKey[] = [
  "api_config",
  "email_settings",
];

// ============================================================================
// TYPE MAPPINGS
// ============================================================================

/**
 * Map system setting key to its TypeScript type
 * Useful for type-safe access to settings
 */
export type SettingTypeMap = {
  site_info: SiteInfo;
  contact_info: ContactInfo;
  api_config: ApiConfig;
  theme_config: ThemeConfig;
  feature_flags: FeatureFlags;
  email_settings: EmailSettings;
};

/**
 * Get typed default value for a setting
 * @example
 * const siteInfo = getDefaultSetting('site_info'); // Typed as SiteInfo
 */
export function getDefaultSetting<K extends SystemSettingKey>(
  key: K,
): SettingTypeMap[K] {
  return DEFAULT_SETTINGS[key] as SettingTypeMap[K];
}

/**
 * Get category for a setting
 * @example
 * const cat = getSettingCategory('site_info'); // "general"
 */
export function getSettingCategory(key: SystemSettingKey): string {
  return CATEGORY_MAP[key];
}

/**
 * Check if setting is public
 */
export function isPublicSetting(key: SystemSettingKey): boolean {
  return PUBLIC_SETTINGS.includes(key);
}

/**
 * Check if setting is private
 */
export function isPrivateSetting(key: SystemSettingKey): boolean {
  return PRIVATE_SETTINGS.includes(key);
}

/**
 * Get all settings by category
 */
export function getSettingsByCategory(category: string): SystemSettingKey[] {
  return Object.entries(CATEGORY_MAP)
    .filter(([, cat]) => cat === category)
    .map(([key]) => key as SystemSettingKey);
}

// ============================================================================
// SYNC NOTES
// ============================================================================

/**
 * When syncing from backend, copy these files:
 *
 * blog-v1/src/entities/site_settings/schemas/
 * ├── general.schemas.ts   → Define SiteInfo, ContactInfo, ApiConfig types
 * ├── appearance.schemas.ts → Define ThemeConfig type
 * ├── features.schemas.ts  → Define FeatureFlags type
 * ├── email.schemas.ts     → Define EmailSettings type
 * └── index.ts            → Update registries and exports
 *
 * Process:
 * 1. Copy all interfaces from backend Zod schemas
 * 2. Copy all DEFAULT_* constants
 * 3. Update registries: SITE_SETTING_SCHEMAS, DEFAULT_SETTINGS, CATEGORY_MAP
 * 4. Update PUBLIC_SETTINGS and PRIVATE_SETTINGS lists
 * 5. Update this sync timestamp above
 */
