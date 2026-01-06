/**
 * Product Variant Public API Tests (BDD Style)
 *
 * Tests public read-only endpoints for product variants.
 * Variants are accessed nested under products or by SKU.
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { productVariants } from "./product-variant.model.ts";
import { products } from "../products/product.model.ts";
import { like } from "drizzle-orm";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let testProductId = "";
let productWithNoVariants = "";
const testSlug = "pub-var-test-product";
const testSku = "PUB-VAR-SM-RED";

// ============================================================================
// PRODUCT VARIANT PUBLIC API TEST SUITE
// ============================================================================

describe({
  name: "Product Variant Public API",
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Clean up any leftover test data from this test suite
    await db
      .delete(productVariants)
      .where(like(productVariants.sku, "PUB-VAR%"));
    await db.delete(products).where(like(products.slug, "pub-var%"));

    // Create product with variants
    const [product1] = await db
      .insert(products)
      .values({
        name: "Pub Var Test Product",
        slug: testSlug,
        price: "99.99",
        isActive: true,
      })
      .returning();
    testProductId = product1.id;

    // Create product without variants
    const [product2] = await db
      .insert(products)
      .values({
        name: "Pub Var No Variants Product",
        slug: "pub-var-no-variants",
        price: "49.99",
        isActive: true,
      })
      .returning();
    productWithNoVariants = product2.id;

    // Add variants to first product
    await db.insert(productVariants).values([
      {
        productId: testProductId,
        sku: testSku,
        price: "89.99",
        stockQuantity: 25,
        options: { size: "Small", color: "Red" },
        isActive: true,
      },
      {
        productId: testProductId,
        sku: "PUB-VAR-MD-RED",
        price: "94.99",
        stockQuantity: 30,
        options: { size: "Medium", color: "Red" },
        isActive: true,
      },
      {
        productId: testProductId,
        sku: "PUB-VAR-LG-BLUE",
        price: "99.99",
        stockQuantity: 0, // Out of stock
        options: { size: "Large", color: "Blue" },
        isActive: true,
      },
    ]);
  });

  afterAll(async () => {
    await db
      .delete(productVariants)
      .where(like(productVariants.sku, "PUB-VAR%"));
    await db.delete(products).where(like(products.slug, "pub-var%"));

    try {
      await db.$client.end();
    } catch {
      // Ignore
    }
  });

  // --------------------------------------------------------------------------
  // GET VARIANTS BY PRODUCT
  // --------------------------------------------------------------------------

  describe({
    name: "GET /products/:productId/variants",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return variants for a product", async () => {
      const response = await app.request(`/products/${testProductId}/variants`);

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
    });

    it("should return empty array for product with no variants", async () => {
      const response = await app.request(
        `/products/${productWithNoVariants}/variants`,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(Array.isArray(json.data), true);
      assertEquals(json.data.length, 0);
    });
  });

  // --------------------------------------------------------------------------
  // GET VARIANT BY SKU
  // --------------------------------------------------------------------------

  describe({
    name: "GET /variants/sku/:sku",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return variant by SKU", async () => {
      const response = await app.request(`/variants/sku/${testSku}`);

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(json.data.sku, testSku);
    });

    it("should return 404 for non-existent SKU", async () => {
      const response = await app.request("/variants/sku/NON-EXISTENT-SKU-123");

      assertEquals(response.status, 404);
    });
  });

  // --------------------------------------------------------------------------
  // EDGE CASES
  // --------------------------------------------------------------------------

  describe(
    { name: "Edge Cases", sanitizeResources: false, sanitizeOps: false },
    () => {
      it("should not expose admin endpoints publicly", async () => {
        const response = await app.request("/ts-admin/product-variants");
        assertEquals(response.status, 401);
      });
    },
  );
});
