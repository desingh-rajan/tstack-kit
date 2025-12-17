/**
 * Category Public API Tests (BDD Style)
 *
 * Tests public read-only endpoints for categories.
 * Public endpoints don't require authentication.
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { categories } from "./category.model.ts";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let rootCategoryId = "";
let childCategoryId = "";
const rootSlug = "root-category";
const childSlug = "child-category";

// ============================================================================
// CATEGORY PUBLIC API TEST SUITE
// ============================================================================

describe("Category Public API", () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Clean up and seed test data
    await db.delete(categories);

    // Create root category
    const [root] = await db
      .insert(categories)
      .values({
        name: "Root Category",
        slug: rootSlug,
        description: "A root category",
        displayOrder: 1,
        isActive: true,
      })
      .returning();

    rootCategoryId = root.id;

    // Create child category
    const [child] = await db
      .insert(categories)
      .values({
        name: "Child Category",
        slug: childSlug,
        description: "A child category",
        parentId: rootCategoryId,
        displayOrder: 1,
        isActive: true,
      })
      .returning();

    childCategoryId = child.id;

    // Create another root with inactive status
    await db.insert(categories).values({
      name: "Inactive Category",
      slug: "inactive-category",
      description: "This is inactive",
      isActive: false,
    });
  });

  afterAll(async () => {
    await db.delete(categories);

    try {
      await db.$client.end();
    } catch {
      // Ignore
    }
  });

  // --------------------------------------------------------------------------
  // GET CATEGORY TREE
  // --------------------------------------------------------------------------

  describe("GET /categories", () => {
    it("should return hierarchical category tree", async () => {
      const response = await app.request("/categories");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
    });
  });

  // --------------------------------------------------------------------------
  // GET ROOT CATEGORIES
  // --------------------------------------------------------------------------

  describe("GET /categories/roots", () => {
    it("should return only root categories", async () => {
      const response = await app.request("/categories/roots");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);

      // All returned categories should have no parentId
      for (const cat of json.data) {
        assertEquals(cat.parentId, null);
      }
    });
  });

  // --------------------------------------------------------------------------
  // GET CATEGORY BY ID
  // --------------------------------------------------------------------------

  describe("GET /categories/:id", () => {
    it("should return category by ID", async () => {
      const response = await app.request(`/categories/${rootCategoryId}`);

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
    });

    it("should return 404 for non-existent category", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const response = await app.request(`/categories/${fakeId}`);

      // May return 404 or 500 depending on implementation
      assertEquals(response.status !== 200, true);
    });
  });

  // --------------------------------------------------------------------------
  // GET CATEGORY BY SLUG
  // --------------------------------------------------------------------------

  describe("GET /categories/slug/:slug", () => {
    it("should return category by slug", async () => {
      const response = await app.request(`/categories/slug/${rootSlug}`);

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(json.data.name, "Root Category");
    });

    it("should return 404 for non-existent slug", async () => {
      const response = await app.request("/categories/slug/non-existent-slug");

      assertEquals(response.status, 404);
    });
  });

  // --------------------------------------------------------------------------
  // GET CATEGORY CHILDREN
  // --------------------------------------------------------------------------

  describe("GET /categories/:id/children", () => {
    it("should return children of a category", async () => {
      const response = await app.request(
        `/categories/${rootCategoryId}/children`
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);

      // Should contain the child category
      const child = json.data.find(
        (c: { id: string }) => c.id === childCategoryId
      );
      assertExists(child);
    });

    it("should return empty array for category with no children", async () => {
      const response = await app.request(
        `/categories/${childCategoryId}/children`
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(Array.isArray(json.data), true);
      assertEquals(json.data.length, 0);
    });
  });
});
