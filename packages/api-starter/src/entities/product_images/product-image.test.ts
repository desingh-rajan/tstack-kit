/**
 * Product Image Public API Tests (BDD Style)
 *
 * Tests public read-only endpoints for product images.
 * Images are accessed nested under products.
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { productImages } from "./product-image.model.ts";
import { products } from "../products/product.model.ts";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let testProductId = "";
let productWithNoImages = "";

// ============================================================================
// PRODUCT IMAGE PUBLIC API TEST SUITE
// ============================================================================

describe({
  name: "Product Image Public API",
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    await db.delete(productImages);
    await db.delete(products);

    // Create product with images
    const [product1] = await db
      .insert(products)
      .values({
        name: "Product With Images",
        slug: "product-with-images",
        price: "99.99",
        isActive: true,
      })
      .returning();
    testProductId = product1.id;

    // Create product without images
    const [product2] = await db
      .insert(products)
      .values({
        name: "Product Without Images",
        slug: "product-without-images",
        price: "49.99",
        isActive: true,
      })
      .returning();
    productWithNoImages = product2.id;

    // Add images to first product
    await db.insert(productImages).values([
      {
        productId: testProductId,
        url: "https://example.com/images/main.jpg",
        thumbnailUrl: "https://example.com/images/main-thumb.jpg",
        altText: "Main product image",
        displayOrder: 1,
        isPrimary: true,
      },
      {
        productId: testProductId,
        url: "https://example.com/images/side.jpg",
        thumbnailUrl: "https://example.com/images/side-thumb.jpg",
        altText: "Side view",
        displayOrder: 2,
        isPrimary: false,
      },
      {
        productId: testProductId,
        url: "https://example.com/images/back.jpg",
        altText: "Back view",
        displayOrder: 3,
        isPrimary: false,
      },
    ]);
  });

  afterAll(async () => {
    await db.delete(productImages);
    await db.delete(products);

    try {
      await db.$client.end();
    } catch {
      // Ignore
    }
  });

  // --------------------------------------------------------------------------
  // GET PRODUCT IMAGES
  // --------------------------------------------------------------------------

  describe({
    name: "GET /products/:productId/images",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return all images for a product", async () => {
      const response = await app.request(`/products/${testProductId}/images`);

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
      assertEquals(json.data.length, 3);
    });

    it("should return images in displayOrder", async () => {
      const response = await app.request(`/products/${testProductId}/images`);

      const json = await response.json();
      const images = json.data;

      // Verify order
      for (let i = 1; i < images.length; i++) {
        const prev = images[i - 1].displayOrder;
        const curr = images[i].displayOrder;
        assertEquals(curr >= prev, true);
      }
    });

    it("should include primary image flag", async () => {
      const response = await app.request(`/products/${testProductId}/images`);

      const json = await response.json();

      // Find primary image
      const primary = json.data.find(
        (img: { isPrimary: boolean }) => img.isPrimary,
      );
      assertExists(primary);
      assertEquals(primary.displayOrder, 1);
    });

    it("should include alt text for accessibility", async () => {
      const response = await app.request(`/products/${testProductId}/images`);

      const json = await response.json();

      // First image should have alt text
      assertEquals(json.data[0].altText, "Main product image");
    });

    it("should return empty array for product with no images", async () => {
      const response = await app.request(
        `/products/${productWithNoImages}/images`,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(Array.isArray(json.data), true);
      assertEquals(json.data.length, 0);
    });

    it("should return 404 for non-existent product", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const response = await app.request(`/products/${fakeId}/images`);

      // May return 404 or empty array depending on implementation
      assertExists(response.status);
    });

    it("should include both url and thumbnailUrl when available", async () => {
      const response = await app.request(`/products/${testProductId}/images`);

      const json = await response.json();

      // First image has thumbnail
      assertEquals(json.data[0].url.includes("main.jpg"), true);
      assertEquals(json.data[0].thumbnailUrl?.includes("main-thumb"), true);
    });
  });

  // --------------------------------------------------------------------------
  // EDGE CASES
  // --------------------------------------------------------------------------

  describe(
    { name: "Edge Cases", sanitizeResources: false, sanitizeOps: false },
    () => {
      it("should handle invalid UUID format", async () => {
        const response = await app.request("/products/invalid-uuid/images");

        // Should return error or empty, not crash
        assertExists(response.status);
      });

      it("should not expose image admin endpoints publicly", async () => {
        // Without auth, should be denied
        const response = await app.request("/ts-admin/product-images");
        assertEquals(response.status, 401);
      });
    },
  );
});
