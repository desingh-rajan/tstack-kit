/**
 * Slug Utility Functions
 *
 * SEO-friendly slug generation and uniqueness validation
 * Used by products, categories, and brands entities
 */

/**
 * Generate a URL-safe slug from a string
 *
 * @example
 * generateSlug("Stainless Steel Kadai 12 inch")
 * // Returns: "stainless-steel-kadai-12-inch"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending a number suffix if needed
 *
 * @example
 * ensureUniqueSlug("cast-iron-kadai", ["cast-iron-kadai", "cast-iron-kadai-1"])
 * // Returns: "cast-iron-kadai-2"
 */
export function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
): string {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Validate that a slug follows the correct format
 * - Lowercase letters, numbers, and hyphens only
 * - No leading/trailing hyphens
 * - No consecutive hyphens
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
