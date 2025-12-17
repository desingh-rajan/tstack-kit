import { z } from "zod";

/**
 * Product Variant DTOs
 *
 * Validation schemas for product variant operations
 */

// Create Product Variant DTO
export const CreateProductVariantSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  sku: z.string().max(100, "SKU too long").optional().nullable(),
  price: z.string().or(z.number()).transform((val) => val ? String(val) : null)
    .optional().nullable(),
  compareAtPrice: z.string().or(z.number()).transform((val) =>
    val ? String(val) : null
  ).optional().nullable(),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative").optional()
    .default(0),
  options: z.record(z.string(), z.string()).default({}), // e.g., {"size": "10 inch"}
  imageId: z.string().uuid("Invalid image ID").optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export type CreateProductVariantDTO = z.infer<
  typeof CreateProductVariantSchema
>;

// Update Product Variant DTO
export const UpdateProductVariantSchema = z.object({
  sku: z.string().max(100).optional().nullable(),
  price: z.string().or(z.number()).transform((val) => val ? String(val) : null)
    .optional().nullable(),
  compareAtPrice: z.string().or(z.number()).transform((val) =>
    val ? String(val) : null
  ).optional().nullable(),
  stockQuantity: z.number().int().min(0).optional(),
  options: z.record(z.string(), z.string()).optional(),
  imageId: z.string().uuid("Invalid image ID").optional().nullable(),
  isActive: z.boolean().optional(),
});

export type UpdateProductVariantDTO = z.infer<
  typeof UpdateProductVariantSchema
>;

// Bulk Create Variants DTO (for generating variant matrix)
export const BulkCreateVariantsSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  variants: z.array(z.object({
    sku: z.string().max(100).optional().nullable(),
    price: z.string().or(z.number()).transform((val) =>
      val ? String(val) : null
    ).optional().nullable(),
    stockQuantity: z.number().int().min(0).optional().default(0),
    options: z.record(z.string(), z.string()),
  })),
});

export type BulkCreateVariantsDTO = z.infer<typeof BulkCreateVariantsSchema>;

// Product Variant Response DTO
export interface ProductVariantResponseDTO {
  id: string;
  productId: string;
  sku: string | null;
  price: string | null;
  compareAtPrice: string | null;
  stockQuantity: number;
  options: Record<string, string>;
  imageId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Populated from join
  image?: { id: string; url: string; thumbnailUrl: string | null } | null;
}
