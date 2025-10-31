import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

/**
 * Generic CRUD API Tests for Scaffolded Entities
 *
 * This template can be used to test any entity created with `tstack scaffold <entity>`
 *
 * Prerequisites:
 * 1. Server must be running: deno task dev
 * 2. Database must be migrated: deno task migrate:run
 * 3. Entity must be scaffolded: tstack scaffold articles
 *
 * Usage:
 * 1. Copy this file: cp tests/crud.template.test.ts tests/articles.test.ts
 * 2. Update ENTITY_NAME and ENTITY_ENDPOINT
 * 3. Update sampleData with your entity fields
 * 4. Run: deno test --allow-all tests/articles.test.ts
 */

// ============================================
// CONFIGURATION - UPDATE THESE FOR YOUR ENTITY
// ============================================
const ENTITY_NAME = "Article"; // Singular, capitalized (e.g., "Article", "Product", "User")
const ENTITY_ENDPOINT = "/articles"; // API endpoint (e.g., "/articles", "/products", "/users")

// Sample data for creating entity - UPDATE WITH YOUR ENTITY FIELDS
const sampleData = {
  title: "Test Article Title",
  content:
    "This is test article content with enough text to make it realistic.",
  author: "John Doe",
  published: true,
  // Add your entity-specific fields here
};

// Updated data for testing update - UPDATE WITH YOUR ENTITY FIELDS
const updatedData = {
  title: "Updated Article Title",
  content: "This is updated article content.",
  author: "Jane Smith",
  published: false,
};

// ============================================
// TEST SUITE - NO NEED TO MODIFY BELOW
// ============================================
const BASE_URL = "http://localhost:8000/api";
let entityId = 0;

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

Deno.test(`${ENTITY_NAME} CRUD API Tests`, async (t) => {
  // ============================================
  // 1. CREATE - POST /api/:entity
  // ============================================
  await t.step(`1. Create ${ENTITY_NAME}`, async () => {
    const { status, data } = await apiRequest(ENTITY_ENDPOINT, {
      method: "POST",
      body: JSON.stringify(sampleData),
    });

    assertEquals(status, 201, "Should return 201 Created");
    assertEquals(data.status, "success");
    assertExists(data.data, "Response should contain data");
    assertExists(data.data.id, "Created entity should have an ID");

    // Verify all fields are present
    for (const key in sampleData) {
      assertExists(data.data[key], `Field '${key}' should exist in response`);
    }

    // Save ID for subsequent tests
    entityId = data.data.id;

    console.log(`✅ ${ENTITY_NAME} created successfully`);
    console.log(`   ID: ${entityId}`);
  });

  // ============================================
  // 2. GET ALL - GET /api/:entity
  // ============================================
  await t.step(`2. Get all ${ENTITY_NAME}s`, async () => {
    const { status, data } = await apiRequest(ENTITY_ENDPOINT, {
      method: "GET",
    });

    assertEquals(status, 200, "Should return 200 OK");
    assertEquals(data.status, "success");
    assertExists(data.data, "Response should contain data");
    assertEquals(Array.isArray(data.data), true, "Data should be an array");
    assertEquals(data.data.length > 0, true, "Should have at least one entity");

    console.log(`✅ Retrieved all ${ENTITY_NAME}s`);
    console.log(`   Total: ${data.data.length}`);
  });

  // ============================================
  // 3. GET BY ID - GET /api/:entity/:id
  // ============================================
  await t.step(`3. Get ${ENTITY_NAME} by ID`, async () => {
    const { status, data } = await apiRequest(
      `${ENTITY_ENDPOINT}/${entityId}`,
      {
        method: "GET",
      },
    );

    assertEquals(status, 200, "Should return 200 OK");
    assertEquals(data.status, "success");
    assertExists(data.data, "Response should contain data");
    assertEquals(data.data.id, entityId, "Should return correct entity");

    // Verify all fields are present
    for (const key in sampleData) {
      assertExists(data.data[key], `Field '${key}' should exist in response`);
    }

    console.log(`✅ ${ENTITY_NAME} retrieved by ID`);
  });

  // ============================================
  // 4. GET NON-EXISTENT ID - GET /api/:entity/99999
  // ============================================
  await t.step(`4. Get non-existent ${ENTITY_NAME} (should fail)`, async () => {
    const { status, data } = await apiRequest(`${ENTITY_ENDPOINT}/99999`, {
      method: "GET",
    });

    assertEquals(status, 404, "Should return 404 Not Found");
    assertEquals(data.status, "error");

    console.log(`✅ Non-existent ${ENTITY_NAME} handled correctly`);
  });

  // ============================================
  // 5. UPDATE - PUT /api/:entity/:id
  // ============================================
  await t.step(`5. Update ${ENTITY_NAME}`, async () => {
    const { status, data } = await apiRequest(
      `${ENTITY_ENDPOINT}/${entityId}`,
      {
        method: "PUT",
        body: JSON.stringify(updatedData),
      },
    );

    assertEquals(status, 200, "Should return 200 OK");
    assertEquals(data.status, "success");
    assertExists(data.data, "Response should contain data");
    assertEquals(data.data.id, entityId, "Should return same entity ID");

    // Verify updated fields
    for (const key in updatedData) {
      assertEquals(
        data.data[key],
        updatedData[key as keyof typeof updatedData],
        `Field '${key}' should be updated`,
      );
    }

    console.log(`✅ ${ENTITY_NAME} updated successfully`);
  });

  // ============================================
  // 6. UPDATE NON-EXISTENT - PUT /api/:entity/99999
  // ============================================
  await t.step(
    `6. Update non-existent ${ENTITY_NAME} (should fail)`,
    async () => {
      const { status, data } = await apiRequest(`${ENTITY_ENDPOINT}/99999`, {
        method: "PUT",
        body: JSON.stringify(updatedData),
      });

      assertEquals(status, 404, "Should return 404 Not Found");
      assertEquals(data.status, "error");

      console.log(`✅ Update non-existent ${ENTITY_NAME} handled correctly`);
    },
  );

  // ============================================
  // 7. VALIDATION - POST with invalid data
  // ============================================
  await t.step(
    `7. Create ${ENTITY_NAME} with invalid data (should fail)`,
    async () => {
      const { status, data } = await apiRequest(ENTITY_ENDPOINT, {
        method: "POST",
        body: JSON.stringify({}), // Empty object - should fail validation
      });

      // Should return 400 Bad Request or 422 Unprocessable Entity
      assertEquals(
        status === 400 || status === 422,
        true,
        "Should return 400 or 422 for invalid data",
      );
      assertEquals(data.status, "error");

      console.log(`✅ Validation working correctly`);
    },
  );

  // ============================================
  // 8. DELETE - DELETE /api/:entity/:id
  // ============================================
  await t.step(`8. Delete ${ENTITY_NAME}`, async () => {
    const { status, data } = await apiRequest(
      `${ENTITY_ENDPOINT}/${entityId}`,
      {
        method: "DELETE",
      },
    );

    assertEquals(status, 200, "Should return 200 OK");
    assertEquals(data.status, "success");

    console.log(`✅ ${ENTITY_NAME} deleted successfully`);
  });

  // ============================================
  // 9. VERIFY DELETION - GET /api/:entity/:id
  // ============================================
  await t.step(`9. Verify ${ENTITY_NAME} is deleted`, async () => {
    const { status, data } = await apiRequest(
      `${ENTITY_ENDPOINT}/${entityId}`,
      {
        method: "GET",
      },
    );

    assertEquals(status, 404, "Should return 404 Not Found");
    assertEquals(data.status, "error");

    console.log(`✅ ${ENTITY_NAME} deletion verified`);
  });

  // ============================================
  // 10. DELETE NON-EXISTENT - DELETE /api/:entity/99999
  // ============================================
  await t.step(
    `10. Delete non-existent ${ENTITY_NAME} (should fail)`,
    async () => {
      const { status, data } = await apiRequest(`${ENTITY_ENDPOINT}/99999`, {
        method: "DELETE",
      });

      assertEquals(status, 404, "Should return 404 Not Found");
      assertEquals(data.status, "error");

      console.log(`✅ Delete non-existent ${ENTITY_NAME} handled correctly`);
    },
  );
});

// ============================================
// ADDITIONAL TEST IDEAS (UNCOMMENT TO USE)
// ============================================

/*
// Pagination Tests
Deno.test(`${ENTITY_NAME} Pagination Tests`, async (t) => {
  await t.step("Test pagination with page and limit", async () => {
    const { status, data } = await apiRequest(`${ENTITY_ENDPOINT}?page=1&limit=10`, {
      method: "GET",
    });

    assertEquals(status, 200);
    assertExists(data.data);
    assertExists(data.pagination);
    assertEquals(data.pagination.page, 1);
    assertEquals(data.pagination.limit, 10);
  });
});

// Search/Filter Tests
Deno.test(`${ENTITY_NAME} Search Tests`, async (t) => {
  await t.step("Test search functionality", async () => {
    const { status, data } = await apiRequest(`${ENTITY_ENDPOINT}?search=test`, {
      method: "GET",
    });

    assertEquals(status, 200);
    assertExists(data.data);
  });
});

// Sorting Tests
Deno.test(`${ENTITY_NAME} Sorting Tests`, async (t) => {
  await t.step("Test sorting by field", async () => {
    const { status, data } = await apiRequest(`${ENTITY_ENDPOINT}?sortBy=createdAt&order=desc`, {
      method: "GET",
    });

    assertEquals(status, 200);
    assertExists(data.data);
  });
});
*/
