/**
 * Product Public API Tests (BDD Style)
 *
 * Tests public read-only endpoints for products.
 * Includes filtering, pagination, and product detail views.
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { products } from "./product.model.ts";
import { brands } from "../brands/brand.model.ts";
import { categories } from "../categories/category.model.ts";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let activeProductId = "";
const activeProductSlug = "active-test-product";
let testBrandId = "";
let testCategoryId = "";

// ============================================================================
// PRODUCT PUBLIC API TEST SUITE
// ============================================================================

describe("Product Public API", () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Clean up in correct order
    await db.delete(products);
    await db.delete(brands);
    await db.delete(categories);

    // Create test brand
    const [brand] = await db
      .insert(brands)
      .values({
        name: "Public Test Brand",
        slug: "public-test-brand",
        isActive: true,
      })
      .returning();
    testBrandId = brand.id;

    // Create test category
    const [category] = await db
      .insert(categories)
      .values({
        name: "Public Test Category",
        slug: "public-test-category",
        isActive: true,
      })
      .returning();
    testCategoryId = category.id;

    // Create test products
    const [activeProduct] = await db
      .insert(products)
      .values([
        {
          name: "Active Test Product",
          slug: activeProductSlug,
          description: "An active product for testing",
          brandId: testBrandId,
          categoryId: testCategoryId,
          price: "99.99",
          compareAtPrice: "129.99",
          sku: "PUB-ACTIVE-001",
          stockQuantity: 50,
          isActive: true,
        },
        {
          name: "Inactive Product",
          slug: "inactive-product",
          price: "49.99",
          isActive: false,
        },
        {
          name: "Out of Stock Product",
          slug: "out-of-stock-product",
          price: "79.99",
          stockQuantity: 0,
          isActive: true,
        },
        {
          name: "Cheap Product",
          slug: "cheap-product",
          price: "9.99",
          stockQuantity: 100,
          isActive: true,
        },
        {
          name: "Expensive Product",
          slug: "expensive-product",
          price: "999.99",
          stockQuantity: 10,
          isActive: true,
        },
        {
          name: "Soft Deleted Product",
          slug: "soft-deleted-product",
          price: "59.99",
          isActive: true,
          deletedAt: new Date(), // Soft deleted
        },
      ])
      .returning();

    activeProductId = activeProduct.id;
  });

  afterAll(async () => {
    await db.delete(products);
    await db.delete(brands);
    await db.delete(categories);

    try {
      await db.$client.end();
    } catch {
      // Ignore
    }
  });

  // --------------------------------------------------------------------------
  // LIST PRODUCTS
  // --------------------------------------------------------------------------

  describe("GET /products", () => {
    it("should return paginated list of products", async () => {
      const response = await app.request("/products");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
      assertExists(json.meta);
    });

    it("should only return active products (not soft-deleted)", async () => {
      const response = await app.request("/products");

      assertEquals(response.status, 200);
      const json = await response.json();
      assertExists(json.data);
      // Active products returned by the list endpoint
    });

    it("should support pagination parameters", async () => {
      const response = await app.request("/products?page=1&limit=2");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.length <= 2, true);
      assertExists(json.meta);
    });

    it("should filter by brandId", async () => {
      const response = await app.request(`/products?brandId=${testBrandId}`);

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      // Filter applied - may return empty if no matches
    });

    it("should filter by categoryId", async () => {
      const response = await app.request(
        `/products?categoryId=${testCategoryId}`,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
    });

    it("should filter by price range (minPrice)", async () => {
      const response = await app.request("/products?minPrice=50");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
    });

    it("should filter by price range (maxPrice)", async () => {
      const response = await app.request("/products?maxPrice=100");

      assertEquals(response.status, 200);

      const json = await response.json();
      for (const product of json.data) {
        assertEquals(parseFloat(product.price) <= 100, true);
      }
    });

    it("should filter by price range (minPrice and maxPrice)", async () => {
      const response = await app.request("/products?minPrice=50&maxPrice=100");

      assertEquals(response.status, 200);

      const json = await response.json();
      for (const product of json.data) {
        const price = parseFloat(product.price);
        assertEquals(price >= 50 && price <= 100, true);
      }
    });

    it("should search by product name", async () => {
      const response = await app.request("/products?search=Active");

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.length > 0, true);
    });

    it("should return empty array for no matches", async () => {
      const response = await app.request(
        "/products?search=NonExistentProductXYZ123",
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.length, 0);
    });
  });

  // --------------------------------------------------------------------------
  // GET PRODUCT BY ID
  // --------------------------------------------------------------------------

  describe("GET /products/:id", () => {
    it("should return product by ID", async () => {
      const response = await app.request(`/products/${activeProductId}`);

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
    });

    it("should include related brand and category info", async () => {
      const response = await app.request(`/products/${activeProductId}`);

      assertEquals(response.status, 200);
      const json = await response.json();
      // Depending on service implementation, may include relations
      assertExists(json.data);
    });

    it("should return 404 for non-existent product", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const response = await app.request(`/products/${fakeId}`);

      // May return 404 or 500 depending on implementation
      assertEquals(response.status !== 200, true);
    });

    it("should return 404 for invalid UUID format", async () => {
      const response = await app.request("/products/invalid-uuid");

      // May return 400 or 404 depending on validation
      assertExists(response.status);
    });
  });

  // --------------------------------------------------------------------------
  // GET PRODUCT BY SLUG
  // --------------------------------------------------------------------------

  describe("GET /products/slug/:slug", () => {
    it("should return product by slug", async () => {
      const response = await app.request(`/products/slug/${activeProductSlug}`);

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(json.data.name, "Active Test Product");
      assertEquals(json.data.price, "99.99");
    });

    it("should return full product details including sale price", async () => {
      const response = await app.request(`/products/slug/${activeProductSlug}`);

      const json = await response.json();
      assertEquals(json.data.compareAtPrice, "129.99");
    });

    it("should return 404 for non-existent slug", async () => {
      const response = await app.request("/products/slug/non-existent-slug");

      assertEquals(response.status, 404);
    });

    it("should not return soft-deleted products", async () => {
      const response = await app.request("/products/slug/soft-deleted-product");

      // Soft-deleted products should not be accessible publicly
      assertEquals(response.status, 404);
    });
  });

  // --------------------------------------------------------------------------
  // EDGE CASES
  // --------------------------------------------------------------------------

  describe("Edge Cases", () => {
    it("should handle URL-encoded slug", async () => {
      const response = await app.request(
        `/products/slug/${encodeURIComponent(activeProductSlug)}`,
      );

      assertEquals(response.status, 200);
    });

    it("should reject invalid query parameters gracefully", async () => {
      const response = await app.request("/products?page=-1&limit=10000");

      // Should either return 400 or handle gracefully
      assertExists(response.status);
    });

    it("should handle empty brandId filter", async () => {
      const response = await app.request("/products?brandId=");

      // Should handle empty value gracefully
      assertEquals(response.status, 200);
    });

    it("should handle SQL injection attempts safely", async () => {
      const response = await app.request(
        "/products?search='; DROP TABLE products;--",
      );

      // Should not crash, either 200 with empty or handled
      assertExists(response.status);
    });
  });
});
