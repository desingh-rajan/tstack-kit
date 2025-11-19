/**
 * REFERENCE IMPLEMENTATION: Admin Panel API Tests (BDD Style)
 *
 * This test demonstrates testing admin routes that provide JSON API responses
 * for the @tstack/admin v2.0.0+ interface (pure JSON, no HTML rendering).
 *
 * When you scaffold a new entity with `tstack scaffold products`, a similar
 * test file (product.admin.test.ts) will be automatically generated.
 *
 * TESTING PATTERNS DEMONSTRATED:
 * ================================
 *
 * 1. BDD Test Structure:
 *    - describe(): Logical grouping of related test scenarios
 *    - it(): Individual test cases with clear "should..." naming
 *    - beforeAll(): Suite-level setup (create test users/data once)
 *    - afterAll(): Suite-level cleanup (destroy all test data)
 *
 * 2. Admin Panel JSON API Testing:
 *    - List endpoints with pagination/search/sort
 *    - Entity metadata endpoints (new, edit)
 *    - CRUD operations via JSON API
 *    - Bulk operations
 *
 * 3. Role-Based Access Control:
 *    - Superadmin: Full access to all admin features
 *    - Admin: Access to admin panel (role-based)
 *    - Regular user: No access to admin panel
 *
 * 4. Test Isolation:
 *    - Each test suite creates its own test data
 *    - No dependencies on seed scripts or fixtures
 *    - Clean slate before and after tests
 *
 * 5. HTTP Testing Best Practices:
 *    - Direct app.request() calls (no server startup)
 *    - Authenticated requests with Bearer tokens
 *    - JSON response validation
 *
 * 6. Professional Documentation:
 *    - Comprehensive inline comments
 *    - Learning resources for developers
 *    - Industry-standard patterns
 *
 * LEARN MORE:
 * ===========
 * - BDD Testing: https://docs.deno.com/runtime/fundamentals/testing/#bdd-style
 * - Admin Package: https://jsr.io/@tstack/admin
 * - REST API Testing: https://hono.dev/docs/guides/testing
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";
import { users } from "../../auth/user.model.ts";
import { like } from "drizzle-orm";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================
// These variables hold tokens and IDs that are created once in beforeAll()
// and used across all tests in this suite.

let superadminToken = "";
let adminToken = "";
let superadminUserId = 0;
let adminUserId = 0;
let testArticleId = 0;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Makes an authenticated request to the admin panel API
 * @param endpoint - The API endpoint (e.g., "/ts-admin/articles")
 * @param token - Bearer token for authentication
 * @param options - Additional request options (method, body, headers)
 * @returns Response object
 */
async function adminRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {},
): Promise<Response> {
  return await app.request(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

/**
 * Creates a test user directly in the database with specified role
 * @param email - User email (must end with @test.local)
 * @param name - User's full name
 * @param password - User's password (will be hashed)
 * @param role - User role (superadmin, admin, or user)
 * @returns Object containing token and userId
 */
async function createTestUser(
  email: string,
  name: string,
  password: string,
  role: "superadmin" | "admin" | "user" = "user",
): Promise<{ token: string; userId: number }> {
  // Import hash function
  const { hashPassword } = await import("../../shared/utils/password.ts");

  // Insert user directly with correct role
  const [user] = await db.insert(users).values({
    email,
    username: name.replace(/\s+/g, "").toLowerCase(),
    password: await hashPassword(password),
    role,
    isActive: true,
    isEmailVerified: true,
  }).returning();

  // Login to get token
  const loginRes = await app.request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const loginData = await loginRes.json();
  return {
    token: loginData.data?.token,
    userId: user.id,
  };
}

// ============================================================================
// ADMIN PANEL API TEST SUITE
// ============================================================================

describe("Article Admin Panel API", () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Clean up any leftover test data first
    await db.delete(articles);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

    // Create superadmin user
    const superadmin = await createTestUser(
      "superadmin@test.local",
      "Test Superadmin",
      "SuperSecure123!",
      "superadmin",
    );
    superadminToken = superadmin.token;
    superadminUserId = superadmin.userId;

    // Create admin user
    const admin = await createTestUser(
      "admin@test.local",
      "Test Admin",
      "AdminSecure123!",
      "admin",
    );
    adminToken = admin.token;
    adminUserId = admin.userId;
  });

  afterAll(async () => {
    // Clean up all test data (articles, tokens, users created during tests)
    await db.delete(articles);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

    // Close DB connection to prevent resource leaks
    try {
      await db.$client.end();
    } catch {
      // Ignore connection close errors
    }
  });

  // --------------------------------------------------------------------------
  // LIST & METADATA ENDPOINTS
  // --------------------------------------------------------------------------

  describe("List and Metadata", () => {
    it("should return JSON list with pagination metadata", async () => {
      const response = await adminRequest(
        "/ts-admin/articles",
        superadminToken,
      );

      assertEquals(response.status, 200);
      assertEquals(
        response.headers.get("content-type")?.split(";")[0],
        "application/json",
      );

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
      assertExists(json.page);
      assertExists(json.total);
    });

    it("should return entity metadata for create form", async () => {
      const response = await adminRequest(
        "/ts-admin/articles/new",
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.entityName);
      assertEquals(json.mode, "create");
      assertExists(json.columns);
    });

    it("should support pagination parameters", async () => {
      const response = await adminRequest(
        "/ts-admin/articles?page=1&limit=10",
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.page, 1);
      assertEquals(json.limit, 10);
    });

    it("should support search functionality", async () => {
      // Create test article
      await adminRequest("/ts-admin/articles", superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: "Searchable Test Article",
          slug: "searchable-test",
          content: "Content",
          excerpt: "Excerpt",
          isPublished: true,
          authorId: superadminUserId,
        }),
      });

      // Search for it
      const response = await adminRequest(
        "/ts-admin/articles?search=Searchable",
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.length > 0, true);
    });

    it("should support sorting parameters", async () => {
      const response = await adminRequest(
        "/ts-admin/articles?sortBy=createdAt&sortOrder=desc",
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
    });
  });

  // --------------------------------------------------------------------------
  // CREATE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Create Operations", () => {
    it("should create article via JSON API", async () => {
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

      assertEquals(response.status, 201);

      const json = await response.json();
      assertExists(json.id);
      testArticleId = json.id; // Save for later tests
    });
  });

  // --------------------------------------------------------------------------
  // READ OPERATIONS
  // --------------------------------------------------------------------------

  describe("Read Operations", () => {
    it("should return single article as JSON", async () => {
      const response = await adminRequest(
        `/ts-admin/articles/${testArticleId}`,
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.title, "Test Article for Admin Panel");
    });

    it("should return entity metadata with data for edit form", async () => {
      const response = await adminRequest(
        `/ts-admin/articles/${testArticleId}/edit`,
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.entityName);
      assertEquals(json.mode, "edit");
      assertExists(json.data);
      assertEquals(json.data.title, "Test Article for Admin Panel");
    });
  });

  // --------------------------------------------------------------------------
  // UPDATE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Update Operations", () => {
    it("should update article via JSON API", async () => {
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
            title: "Updated Admin Article",
            slug: "test-article-admin",
            content: "Updated content",
            excerpt: "Updated excerpt",
            isPublished: true,
            authorId: superadminUserId,
          }),
        },
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.title, "Updated Admin Article");
    });
  });

  // --------------------------------------------------------------------------
  // DELETE OPERATIONS
  // --------------------------------------------------------------------------

  describe("Delete Operations", () => {
    it("should delete single article", async () => {
      // Create article to delete
      const createRes = await adminRequest(
        "/ts-admin/articles",
        superadminToken,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Article to Delete",
            slug: "delete-me",
            content: "Content",
            excerpt: "Excerpt",
            isPublished: true,
            authorId: superadminUserId,
          }),
        },
      );
      const articleId = (await createRes.json()).id;

      // Delete it
      const response = await adminRequest(
        `/ts-admin/articles/${articleId}`,
        superadminToken,
        {
          method: "DELETE",
          headers: { Accept: "application/json" },
        },
      );

      assertEquals(response.status, 200);

      // Verify deletion
      const getResponse = await adminRequest(
        `/ts-admin/articles/${articleId}`,
        superadminToken,
      );

      assertEquals(getResponse.status, 404);
    });

    it("should bulk delete multiple articles", async () => {
      // Create two articles
      const article1Res = await adminRequest(
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
            content: "Content",
            excerpt: "Excerpt",
            isPublished: true,
            authorId: superadminUserId,
          }),
        },
      );
      const id1 = (await article1Res.json()).id;

      const article2Res = await adminRequest(
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
            content: "Content",
            excerpt: "Excerpt",
            isPublished: true,
            authorId: superadminUserId,
          }),
        },
      );
      const id2 = (await article2Res.json()).id;

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

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.count, 2);
    });
  });

  // --------------------------------------------------------------------------
  // ROLE-BASED ACCESS CONTROL
  // --------------------------------------------------------------------------

  describe("Role-Based Access Control", () => {
    it("should allow admin role to access admin panel", async () => {
      const response = await adminRequest(
        "/ts-admin/articles",
        adminToken,
      );

      assertEquals(response.status, 200);
    });

    it("should allow admin role to create articles", async () => {
      const response = await adminRequest(
        "/ts-admin/articles",
        adminToken,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: "Admin Created Article",
            slug: "admin-created",
            content: "Content",
            excerpt: "Excerpt",
            isPublished: true,
            authorId: adminUserId,
          }),
        },
      );

      assertEquals(response.status, 201);
    });
  });
});
