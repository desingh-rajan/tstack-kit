import { z } from "zod";

/**
 * Product Image DTOs
 *
 * Validation schemas for product image operations
 */

// Create Product Image DTO (used after S3 upload)
export const CreateProductImageSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  url: z.string().url("Invalid image URL"),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional().nullable(),
  altText: z.string().max(255, "Alt text too long").optional().nullable(),
  displayOrder: z.number().int().min(0).optional().default(0),
  isPrimary: z.boolean().optional().default(false),
});

export type CreateProductImageDTO = z.infer<typeof CreateProductImageSchema>;

// Update Product Image DTO
export const UpdateProductImageSchema = z.object({
  url: z.string().url("Invalid image URL").optional(),
  thumbnailUrl: z.string().url("Invalid thumbnail URL").optional().nullable(),
  altText: z.string().max(255).optional().nullable(),
  displayOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
});

export type UpdateProductImageDTO = z.infer<typeof UpdateProductImageSchema>;

// Reorder Images DTO
export const ReorderImagesSchema = z.object({
  orderedIds: z.array(z.string().uuid()),
});

export type ReorderImagesDTO = z.infer<typeof ReorderImagesSchema>;

// Product Image Response DTO
export interface ProductImageResponseDTO {
  id: string;
  productId: string;
  url: string;
  thumbnailUrl: string | null;
  altText: string | null;
  displayOrder: number;
  isPrimary: boolean;
  createdAt: Date;
}
