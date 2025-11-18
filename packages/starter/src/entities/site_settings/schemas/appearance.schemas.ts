import { z } from "zod";

/**
 * Theme Config Schema
 * UI theme and appearance settings
 */
export const ThemeConfigSchema = z.object({
  primaryColor: z.string().regex(
    /^#[0-9a-fA-F]{6}$/,
    "Must be a valid hex color",
  ),
  secondaryColor: z.string().regex(
    /^#[0-9a-fA-F]{6}$/,
    "Must be a valid hex color",
  ),
  darkMode: z.boolean(),
  fontFamily: z.string(),
});

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  primaryColor: "#3b82f6",
  secondaryColor: "#10b981",
  darkMode: false,
  fontFamily: "Inter, system-ui, sans-serif",
};
