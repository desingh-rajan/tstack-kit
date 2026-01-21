import { z } from "zod";

/**
 * Product DTOs
 *
 * Validation schemas for product CRUD operations
 */

// Create Product DTO
export const CreateProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name too long"),
  slug: z.string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    )
    .optional(), // Auto-generated from name if not provided
  description: z.string().max(10000, "Description too long").optional()
    .nullable(),
  brandId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().uuid("Invalid brand ID").nullable(),
  ).optional(),
  categoryId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().uuid("Invalid category ID").nullable(),
  ).optional(),
  specifications: z.record(z.string(), z.any()).optional().default({}),
  price: z.string().or(z.number()).transform((val) => String(val)),
  compareAtPrice: z.string().or(z.number()).transform((val) => String(val))
    .optional().nullable(),
  sku: z.string().max(100, "SKU too long").optional().nullable(),
  stockQuantity: z.number().int().min(0, "Stock cannot be negative").optional()
    .default(0),
  isActive: z.boolean().optional().default(true),
});

export type CreateProductDTO = z.infer<typeof CreateProductSchema>;

// Update Product DTO
export const UpdateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    )
    .optional(),
  description: z.string().max(10000).optional().nullable(),
  brandId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().uuid("Invalid brand ID").nullable(),
  ).optional(),
  categoryId: z.preprocess(
    (val) => (val === "" ? null : val),
    z.string().uuid("Invalid category ID").nullable(),
  ).optional(),
  specifications: z.record(z.string(), z.any()).optional(),
  price: z.string().or(z.number()).transform((val) => String(val)).optional(),
  compareAtPrice: z.string().or(z.number()).transform((val) => String(val))
    .optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  stockQuantity: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateProductDTO = z.infer<typeof UpdateProductSchema>;

// Product Query Params (for filtering/pagination)
export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().optional(),
  category: z.string().optional(), // Category slug
  brand: z.string().optional(), // Brand slug
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
  sortBy: z.enum(["price", "name", "createdAt"]).optional().default(
    "createdAt",
  ),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type ProductQueryDTO = z.infer<typeof ProductQuerySchema>;

// Product Response DTO
export interface ProductResponseDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brandId: string | null;
  categoryId: string | null;
  specifications: Record<string, unknown>;
  price: string;
  compareAtPrice: string | null;
  sku: string | null;
  stockQuantity: number;
  isActive: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // Populated from joins
  brand?: { id: string; name: string; slug: string } | null;
  category?: { id: string; name: string; slug: string } | null;
  images?:
    | Array<{
      id: string;
      url: string;
      thumbnailUrl: string | null;
      altText: string | null;
      isPrimary: boolean;
      displayOrder: number;
    }>
    | null;
}

// Product List Response (paginated)
export interface ProductListResponseDTO {
  data: ProductResponseDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
