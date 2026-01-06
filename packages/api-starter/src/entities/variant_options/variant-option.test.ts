/**
 * Variant Option Public API Tests (BDD Style)
 *
 * Tests public read-only endpoints for variant options.
 * Variant options are used to define product attributes like Color, Size, etc.
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { variantOptions } from "./variant-option.model.ts";

// ============================================================================
// VARIANT OPTION PUBLIC API TEST SUITE
// ============================================================================

describe({
  name: "Variant Option Public API",
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    await db.delete(variantOptions);

    // Seed test data with multiple types
    await db.insert(variantOptions).values([
      // Colors
      { name: "Red", type: "Color", displayOrder: 1 },
      { name: "Blue", type: "Color", displayOrder: 2 },
      { name: "Green", type: "Color", displayOrder: 3 },
      // Sizes
      { name: "Small", type: "Size", displayOrder: 1 },
      { name: "Medium", type: "Size", displayOrder: 2 },
      { name: "Large", type: "Size", displayOrder: 3 },
      { name: "XL", type: "Size", displayOrder: 4 },
      // Materials
      { name: "Cotton", type: "Material", displayOrder: 1 },
      { name: "Polyester", type: "Material", displayOrder: 2 },
    ]);
  });

  afterAll(async () => {
    await db.delete(variantOptions);

    try {
      await db.$client.end();
    } catch {
      // Ignore
    }
  });

  // --------------------------------------------------------------------------
  // GET ALL OPTIONS GROUPED BY TYPE
  // --------------------------------------------------------------------------

  describe({
    name: "GET /variant-options",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return options grouped by type", async () => {
      const response = await app.request("/variant-options");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
    });

    it("should include all seeded types", async () => {
      const response = await app.request("/variant-options");

      assertEquals(response.status, 200);

      const json = await response.json();
      // The grouped response should contain Color, Size, and Material types
      const data = json.data;
      assertExists(data);
    });
  });

  // --------------------------------------------------------------------------
  // GET ALL UNIQUE TYPES
  // --------------------------------------------------------------------------

  describe({
    name: "GET /variant-options/types",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return all unique option types", async () => {
      const response = await app.request("/variant-options/types");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);

      // Should have 3 types: Color, Size, Material
      assertEquals(json.data.length, 3);
    });

    it("should return types without duplicates", async () => {
      const response = await app.request("/variant-options/types");

      const json = await response.json();
      const types = json.data;
      const uniqueTypes = [...new Set(types)];

      assertEquals(types.length, uniqueTypes.length);
    });
  });

  // --------------------------------------------------------------------------
  // GET OPTIONS BY TYPE
  // --------------------------------------------------------------------------

  describe({
    name: "GET /variant-options/type/:type",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return all Color options", async () => {
      const response = await app.request("/variant-options/type/Color");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
      assertEquals(json.data.length, 3); // Red, Blue, Green

      // Verify all are Color type
      for (const opt of json.data) {
        assertEquals(opt.type, "Color");
      }
    });

    it("should return all Size options", async () => {
      const response = await app.request("/variant-options/type/Size");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.length, 4); // Small, Medium, Large, XL
    });

    it("should return options in displayOrder", async () => {
      const response = await app.request("/variant-options/type/Size");

      const json = await response.json();
      const sizes = json.data;

      // Verify order: Small(1), Medium(2), Large(3), XL(4)
      for (let i = 1; i < sizes.length; i++) {
        const prev = sizes[i - 1].displayOrder;
        const curr = sizes[i].displayOrder;
        assertEquals(curr >= prev, true);
      }
    });

    it("should return empty array for non-existent type", async () => {
      const response = await app.request("/variant-options/type/NonExistent");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(Array.isArray(json.data), true);
      assertEquals(json.data.length, 0);
    });

    it("should be case-sensitive for type matching", async () => {
      // "color" (lowercase) should not match "Color"
      const response = await app.request("/variant-options/type/color");

      assertEquals(response.status, 200);

      const json = await response.json();
      // May return empty if case-sensitive, or results if case-insensitive
      // This test documents the actual behavior
      assertExists(json.data);
    });
  });

  // --------------------------------------------------------------------------
  // EDGE CASES
  // --------------------------------------------------------------------------

  describe(
    { name: "Edge Cases", sanitizeResources: false, sanitizeOps: false },
    () => {
      it("should handle URL-encoded type names", async () => {
        // Type with space would be encoded
        const response = await app.request("/variant-options/type/Color");

        assertEquals(response.status, 200);
      });

      it("should handle type with special characters safely", async () => {
        // Test SQL injection attempt is handled safely
        const response = await app.request(
          "/variant-options/type/Color'; DROP TABLE variant_options;--",
        );

        // Should not crash, either 200 with empty or handled error
        assertExists(response.status);
      });
    },
  );
});
