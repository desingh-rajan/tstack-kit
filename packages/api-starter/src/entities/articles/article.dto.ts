import { z } from "zod";

/**
 * Article DTOs - Reference Example
 *
 * Shows validation patterns for:
 * - Required fields (title, content)
 * - Optional fields (excerpt, slug)
 * - Boolean flags (isPublished)
 * - String transformations (trim, slug generation)
 */

// Create Article DTO
export const CreateArticleSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().max(500, "Excerpt too long").optional(),
  slug: z.string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    )
    .optional(), // Auto-generated from title if not provided
  isPublished: z.boolean().optional().default(false),
});

export type CreateArticleDTO = z.infer<typeof CreateArticleSchema>;

// Update Article DTO
export const UpdateArticleSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().max(500).optional(),
  slug: z.string()
    .min(1)
    .max(255)
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must be lowercase letters, numbers, and hyphens only",
    )
    .optional(),
  isPublished: z.boolean().optional(),
});

export type UpdateArticleDTO = z.infer<typeof UpdateArticleSchema>;

// Article Response DTO
export interface ArticleResponseDTO {
  id: number;
  title: string;
  slug: string;
  content: string | null;
  excerpt: string | null;
  isPublished: boolean;
  authorId: number;
  authorName?: string; // Populated from join
  createdAt: Date;
  updatedAt: Date;
}
