import { z } from "zod";

/**
 * Feature Flags Schema
 * Feature toggle flags for the application
 */
export const FeatureFlagsSchema = z.object({
  enableContactForm: z.boolean(),
  enableNewsletter: z.boolean(),
  enableBlog: z.boolean(),
  enableComments: z.boolean(),
  maintenanceMode: z.boolean(),
});

export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableContactForm: true,
  enableNewsletter: true,
  enableBlog: true,
  enableComments: false,
  maintenanceMode: false,
};
