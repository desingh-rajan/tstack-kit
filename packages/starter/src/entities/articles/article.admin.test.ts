import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";

/**
 * REFERENCE IMPLEMENTATION: Admin Route Tests
 *
 * This test file demonstrates how to test admin routes that return JSON responses.
 * @tstack/admin v2.0.0+ returns pure JSON (no HTML rendering).
 *
 * When you scaffold a new entity with `tstack scaffold products`,
 * a similar test file (product.admin.test.ts) will be automatically generated.
 *
 * Key testing patterns:
 * 1. Test JSON API responses
 * 2. Test role-based access control (superadmin, admin, regular user)
 * 3. Test all CRUD operations (list, create, show, edit, update, delete)
 * 4. Test pagination, search, and sorting
 * 5. Test bulk operations
 */

let superadminToken = "";
let adminToken = "";
let superadminUserId = 0;
let testArticleId = 0;

/**
 * Clean up test data before running tests
 * Preserves seeded users (superadmin, alpha, regular user)
 */
async function cleanupTestData() {
  try {
    await db.delete(articles);
    await db.delete(authTokens);
  } catch (error) {
    console.error("[CLEANUP] Error cleaning test data:", error);
    throw error;
  }
}

/**
 * Helper to make authenticated requests
 */
async function adminRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {},
) {
  return await app.request(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

Deno.test("Article Admin API Tests", {
  sanitizeResources: false,
  sanitizeOps: false,
}, async (t) => {
  try {
    await cleanupTestData();

    // Login as superadmin, admin, and regular user
    await t.step("Setup: Login users", async () => {
      // Superadmin login
      const superadminRes = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "superadmin@tonystack.dev",
          password: "SuperSecurePassword123!",
        }),
      });
      const superadminData = await superadminRes.json();
      superadminToken = superadminData.data?.token;
      superadminUserId = superadminData.data?.user?.id;
      assertExists(superadminToken, "Superadmin token should exist");
      assertExists(superadminUserId, "Superadmin user ID should exist");

      // Alpha user login (admin role)
      const alphaRes = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "alpha@tonystack.dev",
          password: "AlphaSecurePassword123!",
        }),
      });
      const alphaData = await alphaRes.json();
      adminToken = alphaData.data?.token;
      assertExists(adminToken, "Admin token should exist");
    });

    // Test 1: JSON list response
    await t.step("GET /ts-admin/articles - JSON list", async () => {
      const response = await adminRequest(
        "/ts-admin/articles",
        superadminToken,
      );

      assertEquals(response.status, 200, "Should return 200 OK");
      assertEquals(
        response.headers.get("content-type")?.split(";")[0],
        "application/json",
        "Should return JSON",
      );

      const json = await response.json();
      assertExists(json.data, "Should have data array");
      assertEquals(Array.isArray(json.data), true, "Data should be an array");
      assertExists(json.page, "Should have page");
      assertExists(json.total, "Should have total");
    });

    // Test 2: Entity metadata for create
    await t.step("GET /ts-admin/articles/new - Entity metadata", async () => {
      const response = await adminRequest(
        "/ts-admin/articles/new",
        superadminToken,
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertExists(json.entityName, "Should have entity name");
      assertEquals(json.mode, "create", "Should be create mode");
      assertExists(json.columns, "Should have columns definition");
    });

    // Test 3: Create article via JSON API
    await t.step("POST /ts-admin/articles - Create via JSON", async () => {
      const response = await adminRequest(
        "/ts-admin/articles",
        superadminToken,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Test Article for Admin Panel",
            slug: "test-article-admin",
            content: "This is test content for the admin panel",
            excerpt: "Test excerpt",
            isPublished: true,
            authorId: superadminUserId,
          }),
        },
      );

      assertEquals(response.status, 201, "Should return 201 Created");

      const json = await response.json();
      assertExists(json.id, "Should have created article ID");
      testArticleId = json.id;
    });

    // Test 4: Show article JSON response
    await t.step(
      "GET /ts-admin/articles/:id - JSON response",
      async () => {
        const response = await adminRequest(
          `/ts-admin/articles/${testArticleId}`,
          superadminToken,
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const json = await response.json();
        assertEquals(
          json.title,
          "Test Article for Admin Panel",
          "Should return correct title",
        );
      },
    );

    // Test 5: Entity metadata for edit
    await t.step(
      "GET /ts-admin/articles/:id/edit - Entity metadata with data",
      async () => {
        const response = await adminRequest(
          `/ts-admin/articles/${testArticleId}/edit`,
          superadminToken,
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const json = await response.json();
        assertExists(json.entityName, "Should have entity name");
        assertEquals(json.mode, "edit", "Should be edit mode");
        assertExists(json.data, "Should have data");
        assertEquals(
          json.data.title,
          "Test Article for Admin Panel",
          "Should have article data",
        );
      },
    );

    // Test 6: Update article via JSON
    await t.step("PUT /ts-admin/articles/:id - Update via JSON", async () => {
      const response = await adminRequest(
        `/ts-admin/articles/${testArticleId}`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Updated Test Article",
            slug: "test-article-admin",
            content: "Updated content",
            excerpt: "Updated excerpt",
            isPublished: true,
            authorId: superadminUserId,
          }),
        },
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertEquals(
        json.title,
        "Updated Test Article",
        "Should have updated title",
      );
    });

    // Test 7: Admin role can access admin panel
    await t.step(
      "Admin role - Can access admin panel",
      async () => {
        const response = await adminRequest(
          "/ts-admin/articles",
          adminToken,
          {
            headers: { Accept: "application/json" },
          },
        );

        assertEquals(
          response.status,
          200,
          "Admin should have access to admin panel",
        );
      },
    );

    // Test 8: Pagination test
    await t.step("Pagination - List with page parameter", async () => {
      const response = await adminRequest(
        "/ts-admin/articles?page=1&limit=10",
        superadminToken,
        {
          headers: { Accept: "application/json" },
        },
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertExists(json.page, "Should have page");
      assertEquals(
        json.page,
        1,
        "Should be on page 1",
      );
      assertEquals(
        json.limit,
        10,
        "Should have limit 10",
      );
    });

    // Test 9: Search functionality
    await t.step("Search - Find articles by title", async () => {
      const response = await adminRequest(
        "/ts-admin/articles?search=Updated",
        superadminToken,
        {
          headers: { Accept: "application/json" },
        },
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertEquals(
        json.data.length > 0,
        true,
        "Should find articles",
      );
    });

    // Test 10: Sorting functionality
    await t.step("Sort - Order by createdAt desc", async () => {
      const response = await adminRequest(
        "/ts-admin/articles?sortBy=createdAt&sortOrder=desc",
        superadminToken,
        {
          headers: { Accept: "application/json" },
        },
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertExists(json.data, "Should have data array");
    });

    // Test 11: Delete article
    await t.step("DELETE /ts-admin/articles/:id - Delete article", async () => {
      const response = await adminRequest(
        `/ts-admin/articles/${testArticleId}`,
        superadminToken,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        },
      );

      assertEquals(
        response.status,
        200,
        "Should return 200 OK after deletion",
      );

      // Verify article is deleted
      const getResponse = await adminRequest(
        `/ts-admin/articles/${testArticleId}`,
        superadminToken,
        {
          headers: { Accept: "application/json" },
        },
      );

      assertEquals(
        getResponse.status,
        404,
        "Article should not be found after deletion",
      );
    });

    // Test 12: Bulk delete
    await t.step("POST /ts-admin/articles/bulk-delete", async () => {
      // Create two articles for bulk delete
      const article1 = await adminRequest(
        "/ts-admin/articles",
        superadminToken,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Bulk Delete Test 1",
            slug: "bulk-delete-1",
            content: "Test",
            excerpt: "Test",
            isPublished: true,
            authorId: superadminUserId,
          }),
        },
      );
      const id1 = (await article1.json()).id;

      const article2 = await adminRequest(
        "/ts-admin/articles",
        superadminToken,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Bulk Delete Test 2",
            slug: "bulk-delete-2",
            content: "Test",
            excerpt: "Test",
            isPublished: true,
            authorId: superadminUserId,
          }),
        },
      );
      const id2 = (await article2.json()).id;

      // Bulk delete
      const response = await adminRequest(
        "/ts-admin/articles/bulk-delete",
        superadminToken,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ids: [id1, id2],
          }),
        },
      );

      assertEquals(response.status, 200, "Should delete successfully");

      const json = await response.json();
      assertEquals(
        json.count,
        2,
        "Should delete 2 articles",
      );
    });
  } catch (error) {
    throw error;
  } finally {
    await cleanupTestData();
  }
});
