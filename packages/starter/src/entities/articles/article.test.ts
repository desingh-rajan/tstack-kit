import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { articles } from "./article.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";

let superadminToken = "";
let alphaToken = "";
let alphaArticleId = 0;
let superadminArticleId = 0;

/**
 * Clean up test articles and auth tokens before running tests
 */
async function cleanupTestData() {
  try {
    // Delete all articles
    await db.delete(articles);

    // Delete all auth tokens
    await db.delete(authTokens);

    console.log("[CLEANUP] Test articles and tokens cleaned successfully");
  } catch (error) {
    console.error("[CLEANUP] Error cleaning test data:", error);
    throw error;
  }
}

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

Deno.test("Article API Tests", async (t) => {
  try {
    // Clean up test data before starting
    await cleanupTestData();

    await t.step("Login as superadmin", async () => {
      const superadminEmail = Deno.env.get("SUPERADMIN_EMAIL") ||
        "test-admin@test.local";
      const superadminPassword = Deno.env.get("SUPERADMIN_PASSWORD") ||
        "TestPassword123!";

      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: superadminEmail,
          password: superadminPassword,
        }),
      });
      assertEquals(result.status, 200);
      assertExists(result.data.data.token);
      superadminToken = result.data.data.token;
    });

    await t.step("Login as alpha user", async () => {
      const alphaEmail = Deno.env.get("ALPHA_EMAIL") || "test-user@test.local";
      const alphaPassword = Deno.env.get("ALPHA_PASSWORD") ||
        "TestPassword123!";

      const result = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: alphaEmail,
          password: alphaPassword,
        }),
      });
      assertEquals(result.status, 200);
      assertExists(result.data.data.token);
      alphaToken = result.data.data.token;
    });

    await t.step("POST /articles - without auth should fail", async () => {
      const result = await apiRequest("/articles", {
        method: "POST",
        body: JSON.stringify({
          title: "Unauthorized",
          content: "Fail",
          isPublished: true,
        }),
      });
      assertEquals(result.status, 401);
    });

    await t.step("POST /articles - alpha creates article", async () => {
      const result = await apiRequest("/articles", {
        method: "POST",
        headers: { Authorization: `Bearer ${alphaToken}` },
        body: JSON.stringify({
          title: "Alpha Article",
          slug: "alpha-article",
          content: "Content",
          isPublished: true,
        }),
      });
      assertEquals(result.status, 201);
      alphaArticleId = result.data.data.id;
    });

    await t.step("POST /articles - superadmin creates article", async () => {
      const result = await apiRequest("/articles", {
        method: "POST",
        headers: { Authorization: `Bearer ${superadminToken}` },
        body: JSON.stringify({
          title: "Admin Article",
          slug: "admin-article",
          content: "Content",
          isPublished: true,
        }),
      });
      assertEquals(result.status, 201);
      superadminArticleId = result.data.data.id;
    });

    await t.step("GET /articles - public route", async () => {
      const result = await apiRequest("/articles");
      assertEquals(result.status, 200);
      assertExists(result.data.data);
      assertEquals(Array.isArray(result.data.data), true);
      // Should have articles now
      assertEquals(result.data.data.length > 0, true);
    });

    await t.step("GET /articles/:id - read article", async () => {
      const result = await apiRequest(`/articles/${alphaArticleId}`);
      assertEquals(result.status, 200);
      assertEquals(result.data.data.id, alphaArticleId);
    });

    await t.step("PUT /articles/:id - without auth should fail", async () => {
      const result = await apiRequest(`/articles/${alphaArticleId}`, {
        method: "PUT",
        body: JSON.stringify({ title: "Unauthorized Update" }),
      });
      assertEquals(result.status, 401);
    });

    await t.step("PUT /articles/:id - alpha updates own article", async () => {
      const result = await apiRequest(`/articles/${alphaArticleId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${alphaToken}` },
        body: JSON.stringify({ title: "Updated Alpha Article" }),
      });
      assertEquals(result.status, 200);
    });

    await t.step(
      "PUT /articles/:id - alpha cannot update admin article",
      async () => {
        const result = await apiRequest(`/articles/${superadminArticleId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${alphaToken}` },
          body: JSON.stringify({ title: "Hacked" }),
        });
        assertEquals(result.status, 403);
      },
    );

    await t.step(
      "PUT /articles/:id - superadmin can update any article",
      async () => {
        const result = await apiRequest(`/articles/${alphaArticleId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${superadminToken}` },
          body: JSON.stringify({ title: "Admin Edited" }),
        });
        assertEquals(result.status, 200);
      },
    );

    await t.step(
      "DELETE /articles/:id - without auth should fail",
      async () => {
        const result = await apiRequest(`/articles/${alphaArticleId}`, {
          method: "DELETE",
        });
        assertEquals(result.status, 401);
      },
    );

    await t.step(
      "DELETE /articles/:id - alpha cannot delete admin article",
      async () => {
        const result = await apiRequest(`/articles/${superadminArticleId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${alphaToken}` },
        });
        assertEquals(result.status, 403);
      },
    );

    await t.step(
      "DELETE /articles/:id - alpha deletes own article",
      async () => {
        const result = await apiRequest(`/articles/${alphaArticleId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${alphaToken}` },
        });
        assertEquals(result.status, 200);
      },
    );

    await t.step("GET /articles/:id - verify deleted article 404", async () => {
      const result = await apiRequest(`/articles/${alphaArticleId}`);
      assertEquals(result.status, 404);
    });

    await t.step(
      "DELETE /articles/:id - superadmin deletes remaining",
      async () => {
        const result = await apiRequest(`/articles/${superadminArticleId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${superadminToken}` },
        });
        assertEquals(result.status, 200);
      },
    );
  } finally {
    // Close database connections to prevent resource leaks
    try {
      await db.$client.end();
    } catch {
      // Ignore errors when closing
    }
  }
});
