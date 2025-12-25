/**
 * Tests for slug generation utilities
 *
 * Tests the shared slug module in @tstack/admin
 */

import { assertEquals } from "@std/assert";
import { generateSlug } from "../core/slug.ts";

Deno.test("Slug Generation", async (t) => {
  await t.step("converts basic name to slug", () => {
    assertEquals(generateSlug("Test Category"), "test-category");
  });

  await t.step("handles multiple spaces", () => {
    assertEquals(
      generateSlug("Test   Multiple   Spaces"),
      "test-multiple-spaces"
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
      "samsung-galaxy-s24-ultra"
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
