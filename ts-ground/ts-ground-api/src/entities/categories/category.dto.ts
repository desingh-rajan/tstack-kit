import { z } from "zod";

/**
 * Category DTOs
 *
 * Validation schemas for category CRUD operations
 */

// Create Category DTO
export const CreateCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  slug: z.string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    )
    .optional(), // Auto-generated from name if not provided
  description: z.string().max(2000, "Description too long").optional()
    .nullable(),
  parentId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().uuid("Invalid parent category ID").nullable(),
  ).optional(),
  icon: z.string().max(100, "Icon name too long").optional().nullable(),
  displayOrder: z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export type CreateCategoryDTO = z.infer<typeof CreateCategorySchema>;

// Update Category DTO
export const UpdateCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    )
    .optional(),
  description: z.string().max(2000).optional().nullable(),
  parentId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().uuid("Invalid parent category ID").nullable(),
  ).optional(),
  icon: z.string().max(100).optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateCategoryDTO = z.infer<typeof UpdateCategorySchema>;

// Category Response DTO
export interface CategoryResponseDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Optional: populated for hierarchical responses
  children?: CategoryResponseDTO[];
  parent?: CategoryResponseDTO;
}
