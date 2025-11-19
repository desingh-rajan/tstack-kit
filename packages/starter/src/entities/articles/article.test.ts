import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { users } from "../../auth/user.model.ts";
import { articles } from "./article.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";
import { hashPassword } from "../../shared/utils/password.ts";
import { sql } from "drizzle-orm";

/**
 * Article API Tests
 *
 * TESTING PATTERNS DEMONSTRATED:
 * ================================
 *
 * 1. Authorization Testing:
 *    - Tests ownership-based access control
 *    - Verifies role-based permissions (user vs superadmin)
 *    - Public vs protected route access
 *
 * 2. CRUD Operations:
 *    - Create, Read, Update, Delete workflows
 *    - Proper HTTP status codes for each operation
 *    - Error handling for unauthorized actions
 *
 * 3. Multi-User Scenarios:
 *    - Creates two test users (superadmin + regular user)
 *    - Tests cross-user operations
 *    - Validates ownership boundaries
 *
 * 4. Real-World Security Patterns:
 *    - Users can only edit/delete their own articles
 *    - Superadmin can edit/delete any article
 *    - Public can read but not modify
 */

// ==============================================================================
// TEST STATE
// ==============================================================================

let superadminToken = "";
let alphaToken = "";
let superadminId = 0;
let alphaId = 0;
let alphaArticleId = 0;
let superadminArticleId = 0;

// ==============================================================================
// TEST CONFIGURATION
// ==============================================================================

const SUPERADMIN_EMAIL = "test-superadmin@test.local";
const SUPERADMIN_PASSWORD = "TestSuperAdmin123!";
const ALPHA_EMAIL = "test-alpha@test.local";
const ALPHA_PASSWORD = "TestAlpha123!";

// ==============================================================================
// HELPER FUNCTIONS
// ==============================================================================

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const response = await app.request(endpoint, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: text };
  }
  return { status: response.status, data };
}

// ==============================================================================
// TEST SUITE
// ==============================================================================

describe("Article API", () => {
  // ----------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // ----------------------------------------------------------------------------

  beforeAll(async () => {
    console.log("\n[SETUP] Creating test users and logging in...");

    // Create superadmin
    const hashedSuperPassword = await hashPassword(SUPERADMIN_PASSWORD);
    const [superadmin] = await db.insert(users).values({
      email: SUPERADMIN_EMAIL,
      username: "test-superadmin",
      password: hashedSuperPassword,
      role: "superadmin",
      isActive: true,
      isEmailVerified: true,
    }).returning();
    superadminId = superadmin.id;

    // Create alpha user (regular user)
    const hashedAlphaPassword = await hashPassword(ALPHA_PASSWORD);
    const [alpha] = await db.insert(users).values({
      email: ALPHA_EMAIL,
      username: "test-alpha",
      password: hashedAlphaPassword,
      role: "user",
      isActive: true,
      isEmailVerified: true,
    }).returning();
    alphaId = alpha.id;

    // Login superadmin
    const superResult = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: SUPERADMIN_EMAIL,
        password: SUPERADMIN_PASSWORD,
      }),
    });
    superadminToken = superResult.data.data.token;

    // Login alpha user
    const alphaResult = await apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: ALPHA_EMAIL,
        password: ALPHA_PASSWORD,
      }),
    });
    alphaToken = alphaResult.data.data.token;

    console.log("[SETUP] Test users created and logged in");
  });

  afterAll(async () => {
    console.log("\n[CLEANUP] Removing test data...");

    await db.delete(articles);
    await db.delete(authTokens);
    await db.execute(
      sql`DELETE FROM users WHERE email LIKE '%@test.local'`,
    );

    console.log("[CLEANUP] Test data removed");

    try {
      await db.$client.end();
    } catch {
      // Ignore
    }
  });

  // ----------------------------------------------------------------------------
  // CREATE TESTS
  // ----------------------------------------------------------------------------

  describe("Article Creation", () => {
    /**
     * Regular user creates their own article
     */
    it("should allow alpha user to create article", async () => {
      const result = await apiRequest("/articles", {
        method: "POST",
        headers: { Authorization: `Bearer ${alphaToken}` },
        body: JSON.stringify({
          title: "Alpha's First Article",
          content: "Content by Alpha",
          published: true,
        }),
      });

      assertEquals(result.status, 201);
      assertExists(result.data.data.id);
      assertEquals(result.data.data.authorId, alphaId);
      alphaArticleId = result.data.data.id;
    });

    /**
     * Superadmin creates their own article
     */
    it("should allow superadmin to create article", async () => {
      const result = await apiRequest("/articles", {
        method: "POST",
        headers: { Authorization: `Bearer ${superadminToken}` },
        body: JSON.stringify({
          title: "Admin's Article",
          content: "Content by Admin",
          published: true,
        }),
      });

      assertEquals(result.status, 201);
      assertExists(result.data.data.id);
      assertEquals(result.data.data.authorId, superadminId);
      superadminArticleId = result.data.data.id;
    });
  });

  // ----------------------------------------------------------------------------
  // READ TESTS
  // ----------------------------------------------------------------------------

  describe("Article Reading", () => {
    /**
     * Public route - no authentication required
     */
    it("should list all articles (public route)", async () => {
      const result = await apiRequest("/articles", { method: "GET" });

      assertEquals(result.status, 200);
      assertEquals(result.data.status, "success");
      assertExists(result.data.data);
    });

    /**
     * Public access to individual article
     */
    it("should read single article (public route)", async () => {
      const result = await apiRequest(`/articles/${alphaArticleId}`, {
        method: "GET",
      });

      assertEquals(result.status, 200);
      assertEquals(result.data.data.title, "Alpha's First Article");
    });
  });

  // ----------------------------------------------------------------------------
  // UPDATE TESTS
  // ----------------------------------------------------------------------------

  describe("Article Updates", () => {
    /**
     * Happy path: User updates their own article
     */
    it("should allow alpha to update own article", async () => {
      const result = await apiRequest(`/articles/${alphaArticleId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${alphaToken}` },
        body: JSON.stringify({ title: "Alpha's Updated Article" }),
      });

      assertEquals(result.status, 200);
      assertEquals(result.data.data.title, "Alpha's Updated Article");
    });

    /**
     * Authorization boundary: User cannot update others' articles
     */
    it("should prevent alpha from updating admin article", async () => {
      const result = await apiRequest(`/articles/${superadminArticleId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${alphaToken}` },
        body: JSON.stringify({ title: "Hacked Title" }),
      });

      assertEquals(result.status, 403);
      assertEquals(result.data.status, "error");
    });

    /**
     * Elevated permissions: Superadmin can edit any article
     */
    it("should allow superadmin to update any article", async () => {
      const result = await apiRequest(`/articles/${alphaArticleId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${superadminToken}` },
        body: JSON.stringify({ title: "Admin Modified Alpha's Article" }),
      });

      assertEquals(result.status, 200);
      assertEquals(result.data.data.title, "Admin Modified Alpha's Article");
    });
  });

  // ----------------------------------------------------------------------------
  // DELETE TESTS
  // ----------------------------------------------------------------------------

  describe("Article Deletion", () => {
    /**
     * Authorization boundary: User cannot delete others' articles
     */
    it("should prevent alpha from deleting admin article", async () => {
      const result = await apiRequest(`/articles/${superadminArticleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${alphaToken}` },
      });

      assertEquals(result.status, 403);
      assertEquals(result.data.status, "error");
    });

    /**
     * Ownership rule: User can delete their own article
     */
    it("should allow alpha to delete own article", async () => {
      const result = await apiRequest(`/articles/${alphaArticleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${alphaToken}` },
      });

      assertEquals(result.status, 200);
      assertEquals(result.data.status, "success");
    });

    /**
     * Elevated permissions: Superadmin can delete any article
     */
    it("should allow superadmin to delete remaining article", async () => {
      const result = await apiRequest(`/articles/${superadminArticleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${superadminToken}` },
      });

      assertEquals(result.status, 200);
      assertEquals(result.data.status, "success");
    });
  });
});
