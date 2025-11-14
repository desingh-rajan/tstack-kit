import type { EntityNames } from "../utils/stringUtils.ts";

export function generateAdminTestTemplate(names: EntityNames): string {
  return `import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { ${names.plural} } from "./${names.kebabSingular}.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";

/**
 * ${names.pascalSingular} Admin Panel API Tests
 *
 * Tests admin CRUD operations with both HTML and JSON responses.
 * The admin panel supports content negotiation:
 * - HTML (text/html): Returns Tailwind CSS + htmx UI
 * - JSON (application/json): Returns structured API responses
 *
 * Run: ENVIRONMENT=test deno test --allow-all src/entities/${names.snakePlural}/${names.kebabSingular}.admin.test.ts
 *
 * TODO: Before running tests:
 * 1. Ensure your model has required fields
 * 2. Update sample data below to match your model
 * 3. Run migrations: deno task migrate:run
 * 4. Customize field names in tests to match your entity
 */

const ADMIN_ENDPOINT = "/ts-admin/${names.kebabPlural}";
let superadminToken = "";
let test${names.pascalSingular}Id = 0;

// TODO: Update this sample object to match your model fields
const sample${names.pascalSingular} = {
  // Add your entity fields here
  // Example: name: "Test ${names.pascalSingular}",
};

/**
 * Clean up test data before running tests
 */
async function cleanupTestData() {
  try {
    await db.delete(${names.plural});
    await db.delete(authTokens);
  } catch (error) {
    console.error("[CLEANUP] Error cleaning test data:", error);
    throw error;
  }
}

/**
 * Helper to make authenticated admin requests
 */
async function adminRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {},
) {
  return await app.request(endpoint, {
    ...options,
    headers: {
      Authorization: \`Bearer \${token}\`,
      ...options.headers,
    },
  });
}

Deno.test("${names.pascalSingular} Admin Panel Tests", async (t) => {
  try {
    await cleanupTestData();

    // Setup: Login as superadmin
    await t.step("Setup: Login as superadmin", async () => {
      const response = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "superadmin@tonystack.dev",
          password: "SuperSecurePassword123!",
        }),
      });
      const data = await response.json();
      superadminToken = data.data.token;
      assertExists(superadminToken, "Superadmin token should exist");
    });

    // Test 1: HTML list view
    await t.step(
      "GET /ts-admin/${names.kebabPlural} - HTML list view",
      async () => {
        const response = await adminRequest(ADMIN_ENDPOINT, superadminToken, {
          headers: { Accept: "text/html" },
        });

        assertEquals(response.status, 200, "Should return 200 OK");
        assertEquals(
          response.headers.get("content-type"),
          "text/html; charset=UTF-8",
          "Should return HTML",
        );

        const html = await response.text();
        assertStringIncludes(
          html,
          "${names.pascalPlural}",
          "Should contain page title",
        );
        assertStringIncludes(html, "table", "Should have table element");
        assertStringIncludes(html, "htmx", "Should include htmx");
      },
    );

    // Test 2: JSON list view
    await t.step(
      "GET /ts-admin/${names.kebabPlural} - JSON list view",
      async () => {
        const response = await adminRequest(ADMIN_ENDPOINT, superadminToken, {
          headers: { Accept: "application/json" },
        });

        assertEquals(response.status, 200, "Should return 200 OK");
        assertEquals(
          response.headers.get("content-type"),
          "application/json; charset=UTF-8",
          "Should return JSON",
        );

        const json = await response.json();
        assertExists(json.data, "Should have data property");
        assertExists(json.data.items, "Should have items array");
        assertExists(json.data.pagination, "Should have pagination");
      },
    );

    // Test 3: HTML create form
    await t.step(
      "GET /ts-admin/${names.kebabPlural}/new - HTML create form",
      async () => {
        const response = await adminRequest(
          \`\${ADMIN_ENDPOINT}/new\`,
          superadminToken,
          {
            headers: { Accept: "text/html" },
          },
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const html = await response.text();
        assertStringIncludes(html, "form", "Should contain form");
        assertStringIncludes(
          html,
          "New ${names.pascalSingular}",
          "Should show create title",
        );
      },
    );

    // Test 4: Create via JSON API
    await t.step(
      "POST /ts-admin/${names.kebabPlural} - Create via JSON",
      async () => {
        const response = await adminRequest(ADMIN_ENDPOINT, superadminToken, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sample${names.pascalSingular}),
        });

        assertEquals(response.status, 201, "Should return 201 Created");

        const json = await response.json();
        assertExists(json.data, "Should have data property");
        assertExists(json.data.id, "Should have created ${names.singular} ID");
        test${names.pascalSingular}Id = json.data.id;
      },
    );

    // Test 5: Show HTML view
    await t.step(
      "GET /ts-admin/${names.kebabPlural}/:id - HTML show view",
      async () => {
        const response = await adminRequest(
          \`\${ADMIN_ENDPOINT}/\${test${names.pascalSingular}Id}\`,
          superadminToken,
          {
            headers: { Accept: "text/html" },
          },
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const html = await response.text();
        assertStringIncludes(html, "Edit", "Should have edit button");
        assertStringIncludes(html, "Delete", "Should have delete button");
      },
    );

    // Test 6: Show JSON response
    await t.step(
      "GET /ts-admin/${names.kebabPlural}/:id - JSON response",
      async () => {
        const response = await adminRequest(
          \`\${ADMIN_ENDPOINT}/\${test${names.pascalSingular}Id}\`,
          superadminToken,
          {
            headers: { Accept: "application/json" },
          },
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const json = await response.json();
        assertExists(json.data, "Should have data property");
        assertExists(json.data.id, "Should have id property in data");
        assertEquals(json.data.id, test${names.pascalSingular}Id, "Should return correct ID");
      },
    );

    // Test 7: Edit form HTML
    await t.step(
      "GET /ts-admin/${names.kebabPlural}/:id/edit - HTML edit form",
      async () => {
        const response = await adminRequest(
          \`\${ADMIN_ENDPOINT}/\${test${names.pascalSingular}Id}/edit\`,
          superadminToken,
          {
            headers: { Accept: "text/html" },
          },
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const html = await response.text();
        assertStringIncludes(html, "form", "Should contain form");
        assertStringIncludes(
          html,
          "Edit ${names.pascalSingular}",
          "Should show edit title",
        );
      },
    );

    // Test 8: Update via JSON
    await t.step(
      "PUT /ts-admin/${names.kebabPlural}/:id - Update via JSON",
      async () => {
        const response = await adminRequest(
          \`\${ADMIN_ENDPOINT}/\${test${names.pascalSingular}Id}\`,
          superadminToken,
          {
            method: "PUT",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            body: JSON.stringify(sample${names.pascalSingular}),
          },
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const json = await response.json();
        assertExists(json.data, "Should have updated data");
      },
    );

    // Test 9: Pagination
    await t.step("Pagination - List with page parameter", async () => {
      const response = await adminRequest(
        \`\${ADMIN_ENDPOINT}?page=1&limit=10\`,
        superadminToken,
        {
          headers: { Accept: "application/json" },
        },
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertExists(json.data.pagination, "Should have pagination");
      assertEquals(json.data.pagination.page, 1, "Should be on page 1");
    });

    // Test 10: Search functionality (customize field name to match your entity)
    await t.step("Search - Find ${names.plural}", async () => {
      const response = await adminRequest(
        \`\${ADMIN_ENDPOINT}?search=Test\`,
        superadminToken,
        {
          headers: { Accept: "application/json" },
        },
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertExists(json.data.items, "Should have items array");
    });

    // Test 11: Sorting
    await t.step("Sort - Order by createdAt desc", async () => {
      const response = await adminRequest(
        \`\${ADMIN_ENDPOINT}?sortBy=createdAt&sortOrder=desc\`,
        superadminToken,
        {
          headers: { Accept: "application/json" },
        },
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertExists(json.data.items, "Should have items");
    });

    // Test 12: Delete ${names.singular}
    await t.step(
      "DELETE /ts-admin/${names.kebabPlural}/:id - Delete ${names.singular}",
      async () => {
        const response = await adminRequest(
          \`\${ADMIN_ENDPOINT}/\${test${names.pascalSingular}Id}\`,
          superadminToken,
          {
            method: "DELETE",
            headers: { Accept: "application/json" },
          },
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        // Verify deletion
        const getResponse = await adminRequest(
          \`\${ADMIN_ENDPOINT}/\${test${names.pascalSingular}Id}\`,
          superadminToken,
          {
            headers: { Accept: "application/json" },
          },
        );

        assertEquals(
          getResponse.status,
          404,
          "${names.pascalSingular} should not be found after deletion",
        );
      },
    );

    // Test 13: Bulk delete
    await t.step("POST /ts-admin/${names.kebabPlural}/bulk-delete", async () => {
      // Create two ${names.plural} for bulk delete
      const create1 = await adminRequest(ADMIN_ENDPOINT, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sample${names.pascalSingular}),
      });
      const id1 = (await create1.json()).data.id;

      const create2 = await adminRequest(ADMIN_ENDPOINT, superadminToken, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sample${names.pascalSingular}),
      });
      const id2 = (await create2.json()).data.id;

      // Bulk delete
      const response = await adminRequest(
        \`\${ADMIN_ENDPOINT}/bulk-delete\`,
        superadminToken,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: [id1, id2] }),
        },
      );

      assertEquals(response.status, 200, "Should delete successfully");

      const json = await response.json();
      assertEquals(json.data.deletedCount, 2, "Should delete 2 ${names.plural}");
    });
  } catch (error) {
    console.error("[FAILURE] ${names.pascalSingular} admin tests failed:", error);
    throw error;
  } finally {
    await cleanupTestData();
  }
});
`;
}
