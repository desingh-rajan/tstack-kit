import { z } from "zod";
import { SETTING_CATEGORIES } from "./site-setting.model.ts";

// JSON value type - can be object, array, string, number, boolean, or null
type JsonValue = string | number | boolean | null | JsonValue[] | {
  [key: string]: JsonValue;
};

// Valid category values
const CategoryEnum = z.enum([
  SETTING_CATEGORIES.GENERAL,
  SETTING_CATEGORIES.EMAIL,
  SETTING_CATEGORIES.APPEARANCE,
  SETTING_CATEGORIES.FEATURES,
  SETTING_CATEGORIES.SECTIONS,
  SETTING_CATEGORIES.SHOWCASE,
]);

// JSON value validator - accepts any valid JSON: object, array, string, number, boolean, or null
const JsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(JsonValueSchema),
    z.record(z.string(), JsonValueSchema),
  ])
);

// Create SiteSetting DTO
export const CreateSiteSettingSchema = z.object({
  key: z.string().min(1, "Key is required").max(255),
  category: CategoryEnum,
  value: JsonValueSchema, // Any valid JSON value
  isSystem: z.boolean().optional(),
  valueSchema: z.record(z.string(), z.string()).optional().nullable(), // Simple schema: { field: "type" }
  isPublic: z.boolean().optional(),
  description: z.string().optional().nullable(),
  updatedBy: z.number().optional().nullable(),
});

export type CreateSiteSettingDTO = z.infer<typeof CreateSiteSettingSchema>;

// Update SiteSetting DTO
export const UpdateSiteSettingSchema = z.object({
  category: CategoryEnum.optional(),
  value: JsonValueSchema.optional(), // Any valid JSON value
  valueSchema: z.record(z.string(), z.string()).optional().nullable(), // Simple schema: { field: "type" }
  isPublic: z.boolean().optional(),
  description: z.string().optional().nullable(),
  updatedBy: z.number().optional().nullable(),
});

export type UpdateSiteSettingDTO = z.infer<typeof UpdateSiteSettingSchema>;

// SiteSetting Response DTO
export interface SiteSettingResponseDTO {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  key: string;
  category: string;
  value: JsonValue; // JSON value
  isSystem: boolean;
  valueSchema?: Record<string, string> | null;
  isPublic: boolean;
  description?: string | null;
  updatedBy?: number | null;
}
