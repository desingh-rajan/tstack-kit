import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

/**
 * Articles CRUD API Tests
 *
 * Prerequisites:
 * 1. Server must be running: deno task dev
 * 2. Database must be migrated: deno task migrate:run
 * 3. Articles entity scaffolded: tstack scaffold articles
 *
 * Run: deno test --allow-all tests/articles.test.ts
 */

const BASE_URL = "http://localhost:8000/api";
const ENTITY_ENDPOINT = "/articles";
let articleId = 0;

const sampleArticle = {
  title: "Getting Started with TonyStack",
  content:
    "TonyStack is a lightweight, production-ready backend framework for Deno. It provides a complete solution with PostgreSQL, Drizzle ORM, and Hono framework.",
  author: "John Doe",
  published: true,
  tags: "deno,backend,framework",
};

const updatedArticle = {
  title: "Getting Started with TonyStack - Updated",
  content:
    "TonyStack is an amazing lightweight framework that gets you from zero to production in under 10 seconds!",
  author: "Jane Smith",
  published: false,
  tags: "deno,backend,framework,updated",
};

/**
 * Helper function to make API requests
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  // deno-lint-ignore no-explicit-any
): Promise<{ status: number; data: any }> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();
  return { status: response.status, data };
}

Deno.test("Articles CRUD API Tests", async (t) => {
  // CREATE
  await t.step("1. Create article", async () => {
    const { status, data } = await apiRequest(ENTITY_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(sampleArticle),
    });

    assertEquals(status, 201);
    assertEquals(data.status, "success");
    assertExists(data.data.id);
    assertEquals(data.data.title, sampleArticle.title);
    assertEquals(data.data.author, sampleArticle.author);

    articleId = data.data.id;
    console.log(`✅ Article created with ID: ${articleId}`);
  });

  // GET ALL
  await t.step("2. Get all articles", async () => {
    const { status, data } = await apiRequest(ENTITY_ENDPOINT);

    assertEquals(status, 200);
    assertEquals(data.status, "success");
    assertEquals(Array.isArray(data.data), true);
    assertEquals(data.data.length > 0, true);

    console.log(`✅ Retrieved ${data.data.length} articles`);
  });

  // GET BY ID
  await t.step("3. Get article by ID", async () => {
    const { status, data } = await apiRequest(
      `${ENTITY_ENDPOINT}/${articleId}`,
    );

    assertEquals(status, 200);
    assertEquals(data.status, "success");
    assertEquals(data.data.id, articleId);
    assertEquals(data.data.title, sampleArticle.title);

    console.log(`✅ Article ${articleId} retrieved`);
  });

  // GET NON-EXISTENT
  await t.step("4. Get non-existent article (should fail)", async () => {
    const { status, data } = await apiRequest(`${ENTITY_ENDPOINT}/99999`);

    assertEquals(status, 404);
    assertEquals(data.status, "error");

    console.log("✅ Non-existent article handled correctly");
  });

  // UPDATE
  await t.step("5. Update article", async () => {
    const { status, data } = await apiRequest(
      `${ENTITY_ENDPOINT}/${articleId}`,
      {
        method: "PUT",
        body: JSON.stringify(updatedArticle),
      },
    );

    assertEquals(status, 200);
    assertEquals(data.status, "success");
    assertEquals(data.data.id, articleId);
    assertEquals(data.data.title, updatedArticle.title);
    assertEquals(data.data.author, updatedArticle.author);
    assertEquals(data.data.published, updatedArticle.published);

    console.log("✅ Article updated successfully");
  });

  // UPDATE NON-EXISTENT
  await t.step("6. Update non-existent article (should fail)", async () => {
    const { status, data } = await apiRequest(`${ENTITY_ENDPOINT}/99999`, {
      method: "PUT",
      body: JSON.stringify(updatedArticle),
    });

    assertEquals(status, 404);
    assertEquals(data.status, "error");

    console.log("✅ Update non-existent article handled correctly");
  });

  // VALIDATION
  await t.step(
    "7. Create article with invalid data (should fail)",
    async () => {
      const { status, data } = await apiRequest(ENTITY_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({}),
      });

      assertEquals(status === 400 || status === 422, true);
      assertEquals(data.status, "error");

      console.log("✅ Validation working correctly");
    },
  );

  // DELETE
  await t.step("8. Delete article", async () => {
    const { status, data } = await apiRequest(
      `${ENTITY_ENDPOINT}/${articleId}`,
      {
        method: "DELETE",
      },
    );

    assertEquals(status, 200);
    assertEquals(data.status, "success");

    console.log(`✅ Article ${articleId} deleted`);
  });

  // VERIFY DELETION
  await t.step("9. Verify article is deleted", async () => {
    const { status, data } = await apiRequest(
      `${ENTITY_ENDPOINT}/${articleId}`,
    );

    assertEquals(status, 404);
    assertEquals(data.status, "error");

    console.log("✅ Article deletion verified");
  });

  // DELETE NON-EXISTENT
  await t.step("10. Delete non-existent article (should fail)", async () => {
    const { status, data } = await apiRequest(`${ENTITY_ENDPOINT}/99999`, {
      method: "DELETE",
    });

    assertEquals(status, 404);
    assertEquals(data.status, "error");

    console.log("✅ Delete non-existent article handled correctly");
  });
});
