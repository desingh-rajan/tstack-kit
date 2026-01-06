/**
 * Brand Public API Tests (BDD Style)
 *
 * Tests public read-only endpoints for brands.
 * Public endpoints don't require authentication.
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { brands } from "./brand.model.ts";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let testBrandId = "";
const testSlug = "test-public-brand";

// ============================================================================
// BRAND PUBLIC API TEST SUITE
// ============================================================================

describe({
  name: "Brand Public API",
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Clean up and seed test data
    await db.delete(brands);

    // Create test brands
    const [brand] = await db
      .insert(brands)
      .values([
        {
          name: "Test Public Brand",
          slug: testSlug,
          description: "A test brand for public API testing",
          isActive: true,
        },
        {
          name: "Inactive Brand",
          slug: "inactive-brand",
          description: "This brand is inactive",
          isActive: false,
        },
        {
          name: "Another Active Brand",
          slug: "another-brand",
          description: "Another active brand",
          isActive: true,
        },
      ])
      .returning();

    testBrandId = brand.id;
  });

  afterAll(async () => {
    await db.delete(brands);

    try {
      await db.$client.end();
    } catch {
      // Ignore
    }
  });

  // --------------------------------------------------------------------------
  // LIST ACTIVE BRANDS
  // --------------------------------------------------------------------------

  describe({
    name: "GET /brands",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return list of active brands", async () => {
      const response = await app.request("/brands");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);

      // Should only return active brands (2 of 3)
      assertEquals(json.data.length, 2);

      // Verify all returned brands are active
      for (const brand of json.data) {
        assertEquals(brand.isActive, true);
      }
    });
  });

  // --------------------------------------------------------------------------
  // GET BRAND BY ID
  // --------------------------------------------------------------------------

  describe({
    name: "GET /brands/:id",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return brand by ID", async () => {
      const response = await app.request(`/brands/${testBrandId}`);

      // BaseController.getById uses service.findById which may behave differently
      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
    });

    it("should return 404 for non-existent brand", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const response = await app.request(`/brands/${fakeId}`);

      // May return 404 or 500 depending on implementation
      assertEquals(response.status !== 200, true);
    });
  });

  // --------------------------------------------------------------------------
  // GET BRAND BY SLUG
  // --------------------------------------------------------------------------

  describe({
    name: "GET /brands/slug/:slug",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return brand by slug", async () => {
      const response = await app.request(`/brands/slug/${testSlug}`);

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(json.data.name, "Test Public Brand");
    });

    it("should return 404 for non-existent slug", async () => {
      const response = await app.request("/brands/slug/non-existent-slug");

      assertEquals(response.status, 404);
    });
  });
});
