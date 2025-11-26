/**
 * Site Setting TypeScript types
 * Matches backend site-setting.model.ts and site-setting.dto.ts
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

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

export interface SiteSetting extends Record<string, unknown> {
  id: number;
  key: string;
  category: SettingCategory;
  value: JsonValue;
  isSystem: boolean;
  valueSchema?: Record<string, string> | null;
  isPublic: boolean;
  description?: string | null;
  updatedBy?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteSettingInput {
  key: string;
  category: SettingCategory;
  value: JsonValue;
  isSystem?: boolean;
  valueSchema?: Record<string, string> | null;
  isPublic?: boolean;
  description?: string | null;
  updatedBy?: number | null;
}

export interface UpdateSiteSettingInput {
  category?: SettingCategory;
  value?: JsonValue;
  valueSchema?: Record<string, string> | null;
  isPublic?: boolean;
  description?: string | null;
  updatedBy?: number | null;
}

export interface SiteSettingListResponse {
  success: boolean;
  data: SiteSetting[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface SiteSettingResponse {
  success: boolean;
  data: SiteSetting;
}

export interface DeleteSiteSettingResponse {
  success: boolean;
  message: string;
}
