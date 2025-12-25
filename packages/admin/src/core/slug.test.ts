/**
 * Tests for slug generation utilities
 *
 * Tests the shared slug module in @tstack/admin
 */

import { assertEquals } from "@std/assert";
import {
  ensureUniqueSlug,
  ensureUniqueSlugSync,
  generateSlug,
  isValidSlug,
} from "./slug.ts";

Deno.test("Slug Generation", async (t) => {
  await t.step("converts basic name to slug", () => {
    assertEquals(generateSlug("Test Category"), "test-category");
  });

  await t.step("handles multiple spaces", () => {
    assertEquals(
      generateSlug("Test   Multiple   Spaces"),
      "test-multiple-spaces",
    );
  });

  await t.step("handles special characters", () => {
    assertEquals(generateSlug("Test & Category!"), "test-category");
  });

  await t.step("handles underscores", () => {
    assertEquals(generateSlug("test_category_name"), "test-category-name");
  });

  await t.step("handles mixed case", () => {
    assertEquals(generateSlug("TeSt CaTeGoRy"), "test-category");
  });

  await t.step("handles leading/trailing spaces", () => {
    assertEquals(generateSlug("  Test Category  "), "test-category");
  });

  await t.step("handles leading/trailing hyphens", () => {
    assertEquals(generateSlug("--Test Category--"), "test-category");
  });

  await t.step("handles numbers", () => {
    assertEquals(generateSlug("Category 123"), "category-123");
  });

  await t.step("handles unicode accents", () => {
    // Note: Basic implementation removes accented chars
    assertEquals(generateSlug("Café"), "caf");
  });

  await t.step("handles empty string", () => {
    assertEquals(generateSlug(""), "");
  });

  await t.step("handles single word", () => {
    assertEquals(generateSlug("Electronics"), "electronics");
  });

  await t.step("handles existing hyphens", () => {
    assertEquals(generateSlug("pre-existing-slug"), "pre-existing-slug");
  });

  await t.step("handles mixed hyphens and spaces", () => {
    assertEquals(generateSlug("test - category - name"), "test-category-name");
  });
});

Deno.test("Slug Generation - Real World Examples", async (t) => {
  await t.step("product names", () => {
    assertEquals(generateSlug("iPhone 15 Pro Max"), "iphone-15-pro-max");
    assertEquals(
      generateSlug("Samsung Galaxy S24 Ultra"),
      "samsung-galaxy-s24-ultra",
    );
    assertEquals(generateSlug('MacBook Pro 16"'), "macbook-pro-16");
  });

  await t.step("category names", () => {
    assertEquals(generateSlug("Electronics & Gadgets"), "electronics-gadgets");
    assertEquals(generateSlug("Men's Clothing"), "mens-clothing");
    assertEquals(generateSlug("Home & Garden"), "home-garden");
  });

  await t.step("brand names", () => {
    assertEquals(generateSlug("Nike"), "nike");
    assertEquals(generateSlug("Coca-Cola"), "coca-cola");
    assertEquals(generateSlug("Johnson & Johnson"), "johnson-johnson");
  });
});

Deno.test("ensureUniqueSlugSync", async (t) => {
  await t.step("returns base slug when no conflicts", () => {
    const existingSlugs: string[] = [];
    assertEquals(
      ensureUniqueSlugSync("test-product", existingSlugs),
      "test-product",
    );
  });

  await t.step("appends -1 when base slug exists", () => {
    const existingSlugs = ["test-product"];
    assertEquals(
      ensureUniqueSlugSync("test-product", existingSlugs),
      "test-product-1",
    );
  });

  await t.step("increments suffix until unique", () => {
    const existingSlugs = ["test-product", "test-product-1", "test-product-2"];
    assertEquals(
      ensureUniqueSlugSync("test-product", existingSlugs),
      "test-product-3",
    );
  });

  await t.step("handles gaps in numbering", () => {
    const existingSlugs = ["test-product", "test-product-1", "test-product-3"];
    assertEquals(
      ensureUniqueSlugSync("test-product", existingSlugs),
      "test-product-2",
    );
  });

  await t.step("works with empty base slug", () => {
    const existingSlugs = ["", "-1"];
    assertEquals(ensureUniqueSlugSync("", existingSlugs), "-2");
  });
});

Deno.test("ensureUniqueSlug (async)", async (t) => {
  await t.step("returns base slug when no conflicts", async () => {
    const result = await ensureUniqueSlug("test-product", async () => false);
    assertEquals(result, "test-product");
  });

  await t.step("appends -1 when base slug exists", async () => {
    const existingSlugs = new Set(["test-product"]);
    const result = await ensureUniqueSlug(
      "test-product",
      async (slug) => existingSlugs.has(slug),
    );
    assertEquals(result, "test-product-1");
  });

  await t.step("increments suffix until unique", async () => {
    const existingSlugs = new Set([
      "test-product",
      "test-product-1",
      "test-product-2",
    ]);
    const result = await ensureUniqueSlug(
      "test-product",
      async (slug) => existingSlugs.has(slug),
    );
    assertEquals(result, "test-product-3");
  });

  await t.step("works with database-like async checker", async () => {
    // Simulates database lookup delay
    const existingSlugs = ["cast-iron-kadai"];
    const result = await ensureUniqueSlug("cast-iron-kadai", async (slug) => {
      await new Promise((resolve) => setTimeout(resolve, 1));
      return existingSlugs.includes(slug);
    });
    assertEquals(result, "cast-iron-kadai-1");
  });
});

Deno.test("isValidSlug", async (t) => {
  await t.step("accepts valid slugs", () => {
    assertEquals(isValidSlug("test"), true);
    assertEquals(isValidSlug("test-product"), true);
    assertEquals(isValidSlug("test-product-123"), true);
    assertEquals(isValidSlug("a1b2c3"), true);
  });

  await t.step("rejects uppercase letters", () => {
    assertEquals(isValidSlug("Test"), false);
    assertEquals(isValidSlug("TEST"), false);
    assertEquals(isValidSlug("test-Product"), false);
  });

  await t.step("rejects leading/trailing hyphens", () => {
    assertEquals(isValidSlug("-test"), false);
    assertEquals(isValidSlug("test-"), false);
    assertEquals(isValidSlug("-test-"), false);
  });

  await t.step("rejects consecutive hyphens", () => {
    assertEquals(isValidSlug("test--product"), false);
    assertEquals(isValidSlug("test---product"), false);
  });

  await t.step("rejects special characters", () => {
    assertEquals(isValidSlug("test_product"), false);
    assertEquals(isValidSlug("test product"), false);
    assertEquals(isValidSlug("test.product"), false);
    assertEquals(isValidSlug("test@product"), false);
  });

  await t.step("rejects empty string", () => {
    assertEquals(isValidSlug(""), false);
  });
});
