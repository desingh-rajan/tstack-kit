/**
 * Slug Utility Functions
 *
 * SEO-friendly slug generation and uniqueness validation.
 * Shared across all TStack packages for consistent URL handling.
 *
 * @module
 */

/**
 * Generate a URL-safe slug from a string
 *
 * Transformation rules:
 * - Converts to lowercase
 * - Removes special characters (keeps alphanumeric, spaces, hyphens)
 * - Converts spaces and underscores to hyphens
 * - Collapses multiple hyphens into one
 * - Trims leading/trailing hyphens
 *
 * @example
 * generateSlug("Stainless Steel Kadai 12 inch")
 * // Returns: "stainless-steel-kadai-12-inch"
 *
 * @example
 * generateSlug("iPhone 15 Pro Max")
 * // Returns: "iphone-15-pro-max"
 *
 * @example
 * generateSlug("Men's Clothing & Accessories")
 * // Returns: "mens-clothing-accessories"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Ensure slug is unique by appending a number suffix if needed
 *
 * Uses an async checker function to support database lookups.
 * Increments suffix until a unique slug is found.
 *
 * @param baseSlug - The initial slug to check
 * @param checkExists - Async function that returns true if slug exists
 * @returns Promise resolving to a unique slug
 *
 * @example
 * // With database lookup
 * const slug = await ensureUniqueSlug("cast-iron-kadai", async (s) => {
 *   const existing = await db.query.products.findFirst({
 *     where: eq(products.slug, s)
 *   });
 *   return !!existing;
 * });
 *
 * @example
 * // With in-memory array (useful for testing)
 * const existingSlugs = ["test-product", "test-product-1"];
 * const slug = await ensureUniqueSlug("test-product",
 *   async (s) => existingSlugs.includes(s)
 * );
 * // Returns: "test-product-2"
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  checkExists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

/**
 * Synchronous version of ensureUniqueSlug for cases where
 * all existing slugs are already loaded in memory
 *
 * @param baseSlug - The initial slug to check
 * @param existingSlugs - Array of existing slugs to check against
 * @returns A unique slug string
 *
 * @example
 * ensureUniqueSlugSync("cast-iron-kadai", ["cast-iron-kadai", "cast-iron-kadai-1"])
 * // Returns: "cast-iron-kadai-2"
 */
export function ensureUniqueSlugSync(
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
 *
 * Valid slug requirements:
 * - Lowercase letters and numbers only
 * - Hyphens allowed between segments (not at start/end)
 * - No consecutive hyphens
 *
 * @example
 * isValidSlug("test-product") // true
 * isValidSlug("test--product") // false (consecutive hyphens)
 * isValidSlug("-test-product") // false (leading hyphen)
 * isValidSlug("Test-Product") // false (uppercase)
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
