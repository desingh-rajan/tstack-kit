import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";

/**
 * REFERENCE IMPLEMENTATION: Admin Route Tests
 *
 * This test file demonstrates how to test admin routes that return both:
 * - HTML responses (for browser access with Tailwind + htmx UI)
 * - JSON responses (for API access with Accept: application/json header)
 *
 * When you scaffold a new entity with `tstack scaffold products`,
 * a similar test file (product.admin.test.ts) will be automatically generated.
 *
 * Key testing patterns:
 * 1. Test both HTML and JSON content negotiation
 * 2. Test role-based access control (superadmin, admin, regular user)
 * 3. Test all CRUD operations (list, create, show, edit, update, delete)
 * 4. Test pagination, search, and sorting
 * 5. Test bulk operations
 */

let superadminToken = "";
let adminToken = "";
let testArticleId = 0;

/**
 * Clean up test data before running tests
 */
async function cleanupTestData() {
  try {
    await db.delete(articles);
    await db.delete(authTokens);
    console.log("[CLEANUP] Test articles and tokens cleaned successfully");
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

Deno.test("Article Admin API Tests", async (t) => {
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
      superadminToken = superadminData.data.token;
      assertExists(superadminToken, "Superadmin token should exist");

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
      adminToken = alphaData.data.token;
      assertExists(adminToken, "Admin token should exist");
    });

    // Test 1: HTML response for list view
    await t.step("GET /ts-admin/articles - HTML list view", async () => {
      const response = await adminRequest(
        "/ts-admin/articles",
        superadminToken,
        {
          headers: { Accept: "text/html" },
        },
      );

      assertEquals(response.status, 200, "Should return 200 OK");
      assertEquals(
        response.headers.get("content-type"),
        "text/html; charset=UTF-8",
        "Should return HTML",
      );

      const html = await response.text();
      assertStringIncludes(html, "Articles", "Should contain page title");
      assertStringIncludes(html, "table", "Should contain table element");
      assertStringIncludes(
        html,
        "htmx",
        "Should include htmx for interactivity",
      );
    });

    // Test 2: JSON response for list view
    await t.step("GET /ts-admin/articles - JSON list view", async () => {
      const response = await adminRequest(
        "/ts-admin/articles",
        superadminToken,
        {
          headers: { Accept: "application/json" },
        },
      );

      assertEquals(response.status, 200, "Should return 200 OK");
      assertEquals(
        response.headers.get("content-type"),
        "application/json; charset=UTF-8",
        "Should return JSON",
      );

      const json = await response.json();
      assertExists(json.data, "Should have data property");
      assertExists(json.data.items, "Should have items array");
      assertExists(json.data.pagination, "Should have pagination info");
    });

    // Test 3: HTML response for create form
    await t.step("GET /ts-admin/articles/new - HTML create form", async () => {
      const response = await adminRequest(
        "/ts-admin/articles/new",
        superadminToken,
        {
          headers: { Accept: "text/html" },
        },
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const html = await response.text();
      assertStringIncludes(html, "form", "Should contain form element");
      assertStringIncludes(html, "New Article", "Should show create title");
      assertStringIncludes(html, "title", "Should have title field");
    });

    // Test 4: Create article via JSON API
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
            isPublished: 1,
            authorId: 1,
          }),
        },
      );

      assertEquals(response.status, 201, "Should return 201 Created");

      const json = await response.json();
      assertExists(json.data, "Should have data property");
      assertExists(json.data.id, "Should have created article ID");
      testArticleId = json.data.id;
    });

    // Test 5: Show article HTML view
    await t.step(
      "GET /ts-admin/articles/:id - HTML show view",
      async () => {
        const response = await adminRequest(
          `/ts-admin/articles/${testArticleId}`,
          superadminToken,
          {
            headers: { Accept: "text/html" },
          },
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const html = await response.text();
        assertStringIncludes(
          html,
          "Test Article for Admin Panel",
          "Should show article title",
        );
        assertStringIncludes(html, "Edit", "Should have edit button");
        assertStringIncludes(html, "Delete", "Should have delete button");
      },
    );

    // Test 6: Show article JSON response
    await t.step(
      "GET /ts-admin/articles/:id - JSON response",
      async () => {
        const response = await adminRequest(
          `/ts-admin/articles/${testArticleId}`,
          superadminToken,
          {
            headers: { Accept: "application/json" },
          },
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const json = await response.json();
        assertExists(json.data, "Should have data property");
        assertEquals(
          json.data.title,
          "Test Article for Admin Panel",
          "Should return correct title",
        );
      },
    );

    // Test 7: Edit form HTML
    await t.step(
      "GET /ts-admin/articles/:id/edit - HTML edit form",
      async () => {
        const response = await adminRequest(
          `/ts-admin/articles/${testArticleId}/edit`,
          superadminToken,
          {
            headers: { Accept: "text/html" },
          },
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const html = await response.text();
        assertStringIncludes(html, "form", "Should contain form element");
        assertStringIncludes(html, "Edit Article", "Should show edit title");
        assertStringIncludes(
          html,
          "Test Article for Admin Panel",
          "Should pre-fill with article data",
        );
      },
    );

    // Test 8: Update article via JSON
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
            isPublished: 1,
            authorId: 1,
          }),
        },
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertEquals(
        json.data.title,
        "Updated Test Article",
        "Should have updated title",
      );
    });

    // Test 9: Admin role can access admin panel
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

    // Test 10: Pagination test
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
      assertExists(json.data.pagination, "Should have pagination");
      assertEquals(
        json.data.pagination.page,
        1,
        "Should be on page 1",
      );
      assertEquals(
        json.data.pagination.limit,
        10,
        "Should have limit 10",
      );
    });

    // Test 11: Search functionality
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
        json.data.items.length > 0,
        true,
        "Should find articles",
      );
    });

    // Test 12: Sorting functionality
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
      assertExists(json.data.items, "Should have items");
    });

    // Test 13: Delete article
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

    // Test 14: Bulk delete
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
            isPublished: 1,
            authorId: 1,
          }),
        },
      );
      const id1 = (await article1.json()).data.id;

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
            isPublished: 1,
            authorId: 1,
          }),
        },
      );
      const id2 = (await article2.json()).data.id;

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
        json.data.deletedCount,
        2,
        "Should delete 2 articles",
      );
    });

    console.log("[SUCCESS] All article admin tests passed! ✅");
  } catch (error) {
    console.error("[FAILURE] Article admin tests failed:", error);
    throw error;
  } finally {
    await cleanupTestData();
  }
});
