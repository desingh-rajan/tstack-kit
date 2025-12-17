import { z } from "zod";
import { VARIANT_TYPES as _VARIANT_TYPES } from "./variant-option.model.ts";

/**
 * Variant Option DTOs
 *
 * Validation schemas for variant option CRUD operations
 */

// Create Variant Option DTO
export const CreateVariantOptionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  type: z.string().min(1, "Type is required").max(50, "Type too long"),
  displayOrder: z.number().int().min(0).optional().default(0),
});

export type CreateVariantOptionDTO = z.infer<typeof CreateVariantOptionSchema>;

// Update Variant Option DTO
export const UpdateVariantOptionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.string().min(1).max(50).optional(),
  displayOrder: z.number().int().min(0).optional(),
});

export type UpdateVariantOptionDTO = z.infer<typeof UpdateVariantOptionSchema>;

// Variant Option Response DTO
export interface VariantOptionResponseDTO {
  id: string;
  name: string;
  type: string;
  displayOrder: number;
  createdAt: Date;
}

// Grouped by type (for admin UI)
export interface VariantOptionsByType {
  type: string;
  options: VariantOptionResponseDTO[];
}
