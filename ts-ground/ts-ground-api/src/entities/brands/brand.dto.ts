import { z } from "zod";

/**
 * Brand DTOs
 *
 * Validation schemas for brand CRUD operations
 */

// Create Brand DTO
export const CreateBrandSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  slug: z.string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    )
    .optional(), // Auto-generated from name if not provided
  logoUrl: z.string().url("Invalid logo URL").optional().nullable(),
  websiteUrl: z.string().url("Invalid website URL").optional().nullable(),
  description: z.string().max(2000, "Description too long").optional()
    .nullable(),
  isActive: z.boolean().optional().default(true),
});

export type CreateBrandDTO = z.infer<typeof CreateBrandSchema>;

// Update Brand DTO
export const UpdateBrandSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    )
    .optional(),
  logoUrl: z.string().url("Invalid logo URL").optional().nullable(),
  websiteUrl: z.string().url("Invalid website URL").optional().nullable(),
  description: z.string().max(2000).optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateBrandDTO = z.infer<typeof UpdateBrandSchema>;

// Brand Response DTO
export interface BrandResponseDTO {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
