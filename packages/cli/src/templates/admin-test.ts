import type { EntityNames } from "../utils/stringUtils.ts";

export function generateAdminTestTemplate(names: EntityNames): string {
  return `import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { ${names.plural} } from "./${names.kebabSingular}.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";

/**
 * ${names.pascalSingular} Admin API Tests
 *
 * Tests admin CRUD operations with JSON API (@tstack/admin v2.0.0+).
 * All responses are JSON - no HTML rendering.
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

    // Test 1: List ${names.plural}
    await t.step(
      "GET /ts-admin/${names.kebabPlural} - JSON list",
      async () => {
        const response = await adminRequest(ADMIN_ENDPOINT, superadminToken);

        assertEquals(response.status, 200, "Should return 200 OK");

        const json = await response.json();
        assertExists(json.data, "Should have data property");
        assertEquals(Array.isArray(json.data), true, "Data should be an array");
        assertExists(json.page, "Should have page");
        assertExists(json.total, "Should have total");
      },
    );

    // Test 2: Get entity metadata for creation
    await t.step(
      "GET /ts-admin/${names.kebabPlural}/new - Entity metadata",
      async () => {
        const response = await adminRequest(
          \`\${ADMIN_ENDPOINT}/new\`,
          superadminToken,
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const json = await response.json();
        assertExists(json.entityName, "Should have entity name");
        assertExists(json.columns, "Should have columns");
        assertEquals(json.mode, "create", "Should be in create mode");
      },
    );

    // Test 3: Create via JSON API
    await t.step(
      "POST /ts-admin/${names.kebabPlural} - Create",
      async () => {
        const response = await adminRequest(ADMIN_ENDPOINT, superadminToken, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sample${names.pascalSingular}),
        });

        assertEquals(response.status, 201, "Should return 201 Created");

        const json = await response.json();
        assertExists(json.id, "Should have created ${names.singular} ID");
        test${names.pascalSingular}Id = json.id;
      },
    );

    // Test 4: Show ${names.singular}
    await t.step(
      "GET /ts-admin/${names.kebabPlural}/:id - JSON response",
      async () => {
        const response = await adminRequest(
          \`\${ADMIN_ENDPOINT}/\${test${names.pascalSingular}Id}\`,
          superadminToken,
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const json = await response.json();
        assertExists(json.id, "Should have id property");
        assertEquals(json.id, test${names.pascalSingular}Id, "Should return correct ID");
      },
    );

    // Test 5: Get entity metadata for editing
    await t.step(
      "GET /ts-admin/${names.kebabPlural}/:id/edit - Entity metadata with data",
      async () => {
        const response = await adminRequest(
          \`\${ADMIN_ENDPOINT}/\${test${names.pascalSingular}Id}/edit\`,
          superadminToken,
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const json = await response.json();
        assertExists(json.entityName, "Should have entity name");
        assertExists(json.columns, "Should have columns");
        assertExists(json.data, "Should have data");
        assertEquals(json.mode, "edit", "Should be in edit mode");
        assertEquals(json.data.id, test${names.pascalSingular}Id, "Should return correct ID");
      },
    );

    // Test 6: Update via JSON
    await t.step(
      "PUT /ts-admin/${names.kebabPlural}/:id - Update",
      async () => {
        const response = await adminRequest(
          \`\${ADMIN_ENDPOINT}/\${test${names.pascalSingular}Id}\`,
          superadminToken,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(sample${names.pascalSingular}),
          },
        );

        assertEquals(response.status, 200, "Should return 200 OK");

        const json = await response.json();
        assertExists(json, "Should have updated data");
      },
    );

    // Test 7: Pagination
    await t.step("Pagination - List with page parameter", async () => {
      const response = await adminRequest(
        \`\${ADMIN_ENDPOINT}?page=1&limit=10\`,
        superadminToken,
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertExists(json.page, "Should have page");
      assertEquals(json.page, 1, "Should be on page 1");
      assertExists(json.limit, "Should have limit");
    });

    // Test 8: Search functionality (customize field name to match your entity)
    await t.step("Search - Find ${names.plural}", async () => {
      const response = await adminRequest(
        \`\${ADMIN_ENDPOINT}?search=Test\`,
        superadminToken,
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertExists(json.data, "Should have data array");
      assertEquals(Array.isArray(json.data), true, "Data should be an array");
    });

    // Test 9: Sorting
    await t.step("Sort - Order by createdAt desc", async () => {
      const response = await adminRequest(
        \`\${ADMIN_ENDPOINT}?sortBy=createdAt&sortOrder=desc\`,
        superadminToken,
      );

      assertEquals(response.status, 200, "Should return 200 OK");

      const json = await response.json();
      assertExists(json.data, "Should have data array");
    });

    // Test 10: Delete ${names.singular}
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

    // Test 11: Bulk delete
    await t.step("POST /ts-admin/${names.kebabPlural}/bulk-delete", async () => {
      // Create two ${names.plural} for bulk delete
      const create1 = await adminRequest(ADMIN_ENDPOINT, superadminToken, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sample${names.pascalSingular}),
      });
      const id1 = (await create1.json()).id;

      const create2 = await adminRequest(ADMIN_ENDPOINT, superadminToken, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sample${names.pascalSingular}),
      });
      const id2 = (await create2.json()).id;

      // Bulk delete
      const response = await adminRequest(
        \`\${ADMIN_ENDPOINT}/bulk-delete\`,
        superadminToken,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: [id1, id2] }),
        },
      );

      assertEquals(response.status, 200, "Should delete successfully");

      const json = await response.json();
      assertEquals(json.count, 2, "Should delete 2 ${names.plural}");
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
