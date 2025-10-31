import type { EntityNames } from "../utils/stringUtils.ts";

export function generateTestTemplate(names: EntityNames): string {
  return `import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { app } from "../../main.ts";

/**
 * ${names.pascalSingular} CRUD API Tests
 *
 * Tests run against the Hono app directly (no server needed!)
 * Uses NODE_ENV=test environment automatically.
 *
 * Run: deno task test
 * Or: NODE_ENV=test deno test --allow-all tests/${names.plural}.test.ts
 */

const ENTITY_ENDPOINT = "/api/${names.plural}";
let ${names.singular}Id = 0;

// TODO: Update with your entity's fields
const sample${names.pascalSingular} = {
  name: "Test ${names.pascalSingular}",
  // Add your entity fields here
};

const updated${names.pascalSingular} = {
  name: "Updated ${names.pascalSingular}",
  // Add your entity fields here
};

/**
 * Helper function to make API requests via Hono app
 * No server required - tests run directly against the app!
 */
async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
// deno-lint-ignore no-explicit-any
): Promise<{ status: number; data: any }> {
  const response = await app.request(endpoint, options);
  const data = await response.json();
  return { status: response.status, data };
}

Deno.test("${names.pascalSingular} CRUD API Tests", async (t) => {
  // ============================================
  // CREATE
  // ============================================
  await t.step("1. Create ${names.singular}", async () => {
    const { status, data } = await apiRequest(ENTITY_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(sample${names.pascalSingular}),
    });

    assertEquals(status, 201);
    assertEquals(data.status, "success");
    assertExists(data.data.id);

    ${names.singular}Id = data.data.id;
    console.log(\`[SUCCESS] ${names.pascalSingular} created with ID: \${${names.singular}Id}\`);
  });

  // ============================================
  // GET ALL
  // ============================================
  await t.step("2. Get all ${names.plural}", async () => {
    const { status, data } = await apiRequest(ENTITY_ENDPOINT);

    assertEquals(status, 200);
    assertEquals(data.status, "success");
    assertEquals(Array.isArray(data.data), true);
    assertEquals(data.data.length > 0, true);

    console.log(\`[SUCCESS] Retrieved \${data.data.length} ${names.plural}\`);
  });

  // ============================================
  // GET BY ID
  // ============================================
  await t.step("3. Get ${names.singular} by ID", async () => {
    const { status, data } = await apiRequest(
      \`\${ENTITY_ENDPOINT}/\${${names.singular}Id}\`,
    );

    assertEquals(status, 200);
    assertEquals(data.status, "success");
    assertEquals(data.data.id, ${names.singular}Id);

    console.log(\`[SUCCESS] ${names.pascalSingular} \${${names.singular}Id} retrieved\`);
  });

  // ============================================
  // GET NON-EXISTENT
  // ============================================
  await t.step("4. Get non-existent ${names.singular} (should fail)", async () => {
    const { status, data } = await apiRequest(\`\${ENTITY_ENDPOINT}/99999\`);

    assertEquals(status, 404);
    assertEquals(data.status, "error");

    console.log("[SUCCESS] Non-existent ${names.singular} handled correctly");
  });

  // ============================================
  // UPDATE
  // ============================================
  await t.step("5. Update ${names.singular}", async () => {
    const { status, data } = await apiRequest(
      \`\${ENTITY_ENDPOINT}/\${${names.singular}Id}\`,
      {
        method: "PUT",
        body: JSON.stringify(updated${names.pascalSingular}),
      },
    );

    assertEquals(status, 200);
    assertEquals(data.status, "success");
    assertEquals(data.data.id, ${names.singular}Id);

    console.log("[SUCCESS] ${names.pascalSingular} updated successfully");
  });

  // ============================================
  // UPDATE NON-EXISTENT
  // ============================================
  await t.step("6. Update non-existent ${names.singular} (should fail)", async () => {
    const { status, data } = await apiRequest(\`\${ENTITY_ENDPOINT}/99999\`, {
      method: "PUT",
      body: JSON.stringify(updated${names.pascalSingular}),
    });

    assertEquals(status, 404);
    assertEquals(data.status, "error");

    console.log("[SUCCESS] Update non-existent ${names.singular} handled correctly");
  });

  // ============================================
  // VALIDATION
  // ============================================
  await t.step(
    "7. Create ${names.singular} with invalid data (should fail)",
    async () => {
      const { status, data } = await apiRequest(ENTITY_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({}),
      });

      assertEquals(status === 400 || status === 422, true);
      assertEquals(data.status, "error");

      console.log("[SUCCESS] Validation working correctly");
    },
  );

  // ============================================
  // DELETE
  // ============================================
  await t.step("8. Delete ${names.singular}", async () => {
    const { status, data } = await apiRequest(
      \`\${ENTITY_ENDPOINT}/\${${names.singular}Id}\`,
      {
        method: "DELETE",
      },
    );

    assertEquals(status, 200);
    assertEquals(data.status, "success");

    console.log(\`[SUCCESS] ${names.pascalSingular} \${${names.singular}Id} deleted\`);
  });

  // ============================================
  // VERIFY DELETION
  // ============================================
  await t.step("9. Verify ${names.singular} is deleted", async () => {
    const { status, data } = await apiRequest(
      \`\${ENTITY_ENDPOINT}/\${${names.singular}Id}\`,
    );

    assertEquals(status, 404);
    assertEquals(data.status, "error");

    console.log("[SUCCESS] ${names.pascalSingular} deletion verified");
  });

  // ============================================
  // DELETE NON-EXISTENT
  // ============================================
  await t.step("10. Delete non-existent ${names.singular} (should fail)", async () => {
    const { status, data } = await apiRequest(\`\${ENTITY_ENDPOINT}/99999\`, {
      method: "DELETE",
    });

    assertEquals(status, 404);
    assertEquals(data.status, "error");

    console.log("[SUCCESS] Delete non-existent ${names.singular} handled correctly");
  });
});
`;
}
