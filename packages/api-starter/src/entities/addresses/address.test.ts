import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { users } from "../../auth/user.model.ts";
import { addresses } from "./address.model.ts";
import { hashPassword } from "../../shared/utils/password.ts";
import { eq } from "drizzle-orm";

/**
 * Address & Profile Integration Tests
 *
 * Tests user profile and address CRUD operations
 */

// Test user credentials
const TEST_EMAIL = "address-test@test.local";
const TEST_PASSWORD = "TestPassword123!";

let authToken: string;
let testUserId: number;
let testAddressId: string;

// Helper to make authenticated requests
function authenticatedRequest(
  method: string,
  path: string,
  body?: unknown,
) {
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return app.request(path, options);
}

Deno.test({
  name: "Address & Profile API",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Setup: Create test user directly in database
    await t.step("setup: create test user", async () => {
      console.log("\n[SETUP] Creating test user...");

      // Clean up any existing test user and their addresses
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, TEST_EMAIL))
        .limit(1);

      if (existingUser.length > 0) {
        await db
          .delete(addresses)
          .where(eq(addresses.userId, existingUser[0].id));
        await db.delete(users).where(eq(users.email, TEST_EMAIL));
      }

      // Create fresh test user
      const hashedPassword = await hashPassword(TEST_PASSWORD);
      const result = await db
        .insert(users)
        .values({
          email: TEST_EMAIL,
          password: hashedPassword,
          role: "user",
          isEmailVerified: true,
          isActive: true,
        })
        .returning();

      testUserId = result[0].id;
      console.log(`[SETUP] Test user created: ${TEST_EMAIL}`);
    });

    // Login to get auth token
    await t.step("setup: login test user", async () => {
      const response = await app.request("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: TEST_EMAIL,
          password: TEST_PASSWORD,
        }),
      });

      assertEquals(response.status, 200);
      const data = await response.json();
      assertExists(data.data.token);
      authToken = data.data.token;
    });

    // ============================================
    // Profile Tests
    // ============================================

    await t.step("GET /users/me/profile - get profile", async () => {
      const response = await authenticatedRequest("GET", "/users/me/profile");
      assertEquals(response.status, 200);

      const data = await response.json();
      assertExists(data.data);
      assertExists(data.data.id);
      assertExists(data.data.email);
      assertEquals(data.data.email, TEST_EMAIL);
      assertEquals(typeof data.data.hasGoogleLinked, "boolean");
    });

    await t.step("PUT /users/me/profile - update profile", async () => {
      const response = await authenticatedRequest("PUT", "/users/me/profile", {
        firstName: "Test",
        lastName: "Admin",
        phone: "+919876543210",
      });
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.data.firstName, "Test");
      assertEquals(data.data.lastName, "Admin");
      assertEquals(data.data.phone, "+919876543210");
    });

    await t.step("PUT /users/me/profile - reject invalid phone", async () => {
      const response = await authenticatedRequest("PUT", "/users/me/profile", {
        phone: "invalid-phone",
      });
      assertEquals(response.status, 400);
    });

    await t.step("POST /users/me/avatar - set avatar URL", async () => {
      const response = await authenticatedRequest("POST", "/users/me/avatar", {
        avatarUrl: "https://example.com/avatar.jpg",
      });
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.data.avatarUrl, "https://example.com/avatar.jpg");
    });

    await t.step("DELETE /users/me/avatar - remove avatar", async () => {
      const response = await authenticatedRequest("DELETE", "/users/me/avatar");
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.data.avatarUrl, null);
    });

    // ============================================
    // Address Tests
    // ============================================

    await t.step("GET /addresses - empty list initially", async () => {
      const response = await authenticatedRequest("GET", "/addresses");
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(Array.isArray(data.data), true);
    });

    await t.step("POST /addresses - create first address", async () => {
      const response = await authenticatedRequest("POST", "/addresses", {
        label: "Home",
        fullName: "Test User",
        phone: "+919876543210",
        addressLine1: "123 Main Street",
        addressLine2: "Apt 4B",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        type: "shipping",
      });
      assertEquals(response.status, 201);

      const data = await response.json();
      assertExists(data.data.id);
      assertEquals(data.data.label, "Home");
      assertEquals(data.data.fullName, "Test User");
      assertEquals(data.data.city, "Mumbai");
      assertEquals(data.data.isDefault, true); // First address is default
      testAddressId = data.data.id;
    });

    await t.step("POST /addresses - create second address", async () => {
      const response = await authenticatedRequest("POST", "/addresses", {
        label: "Work",
        fullName: "Test User",
        phone: "+919876543211",
        addressLine1: "456 Office Park",
        city: "Pune",
        state: "Maharashtra",
        postalCode: "411001",
        type: "shipping",
      });
      assertEquals(response.status, 201);

      const data = await response.json();
      assertEquals(data.data.isDefault, false); // Not default
    });

    await t.step("GET /addresses/:id - get address by ID", async () => {
      const response = await authenticatedRequest(
        "GET",
        `/addresses/${testAddressId}`,
      );
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.data.id, testAddressId);
      assertEquals(data.data.label, "Home");
    });

    await t.step("PUT /addresses/:id - update address", async () => {
      const response = await authenticatedRequest(
        "PUT",
        `/addresses/${testAddressId}`,
        {
          label: "Home (Updated)",
          city: "New Delhi",
          state: "Delhi",
          postalCode: "110001",
        },
      );
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.data.label, "Home (Updated)");
      assertEquals(data.data.city, "New Delhi");
    });

    await t.step(
      "GET /addresses/default/shipping - get default shipping address",
      async () => {
        const response = await authenticatedRequest(
          "GET",
          "/addresses/default/shipping",
        );
        assertEquals(response.status, 200);

        const data = await response.json();
        assertEquals(data.data.id, testAddressId);
        assertEquals(data.data.isDefault, true);
      },
    );

    await t.step("POST /addresses - create billing address", async () => {
      const response = await authenticatedRequest("POST", "/addresses", {
        label: "Billing",
        fullName: "Test User",
        phone: "+919876543212",
        addressLine1: "789 Billing Street",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600001",
        type: "billing",
      });
      assertEquals(response.status, 201);

      const data = await response.json();
      assertEquals(data.data.type, "billing");
      assertEquals(data.data.isDefault, true); // First billing address
    });

    await t.step(
      "GET /addresses/default/billing - get default billing address",
      async () => {
        const response = await authenticatedRequest(
          "GET",
          "/addresses/default/billing",
        );
        assertEquals(response.status, 200);

        const data = await response.json();
        assertEquals(data.data.type, "billing");
        assertEquals(data.data.isDefault, true);
      },
    );

    await t.step(
      "PUT /addresses/:id/default - set different default",
      async () => {
        // First get all addresses
        const listResponse = await authenticatedRequest("GET", "/addresses");
        const addresses = (await listResponse.json()).data;
        const workAddress = addresses.find((a: any) => a.label === "Work");

        // Set work address as default
        const response = await authenticatedRequest(
          "PUT",
          `/addresses/${workAddress.id}/default`,
          {},
        );
        assertEquals(response.status, 200);

        const data = await response.json();
        assertEquals(data.data.isDefault, true);

        // Verify old default is no longer default
        const homeResponse = await authenticatedRequest(
          "GET",
          `/addresses/${testAddressId}`,
        );
        const homeData = await homeResponse.json();
        assertEquals(homeData.data.isDefault, false);
      },
    );

    await t.step("POST /addresses - reject invalid postal code", async () => {
      const response = await authenticatedRequest("POST", "/addresses", {
        label: "Invalid",
        fullName: "Test User",
        phone: "+919876543210",
        addressLine1: "123 Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "12345", // Invalid - should be 6 digits
        type: "shipping",
      });
      assertEquals(response.status, 400);
    });

    await t.step("POST /addresses - reject invalid phone", async () => {
      const response = await authenticatedRequest("POST", "/addresses", {
        label: "Invalid",
        fullName: "Test User",
        phone: "12345", // Invalid Indian phone
        addressLine1: "123 Street",
        city: "Mumbai",
        state: "Maharashtra",
        postalCode: "400001",
        type: "shipping",
      });
      assertEquals(response.status, 400);
    });

    await t.step("DELETE /addresses/:id - delete address", async () => {
      const response = await authenticatedRequest(
        "DELETE",
        `/addresses/${testAddressId}`,
      );
      assertEquals(response.status, 200);

      // Verify it's deleted
      const getResponse = await authenticatedRequest(
        "GET",
        `/addresses/${testAddressId}`,
      );
      assertEquals(getResponse.status, 404);
    });

    await t.step("GET /addresses/:id - 404 for non-existent", async () => {
      const response = await authenticatedRequest(
        "GET",
        "/addresses/00000000-0000-0000-0000-000000000000",
      );
      assertEquals(response.status, 404);
    });

    // ============================================
    // Cleanup
    // ============================================

    await t.step(
      "cleanup: delete remaining addresses and test user",
      async () => {
        // Delete remaining addresses via API
        const listResponse = await authenticatedRequest("GET", "/addresses");
        const addressList = (await listResponse.json()).data;

        for (const address of addressList) {
          await authenticatedRequest("DELETE", `/addresses/${address.id}`);
        }

        // Delete test user and their addresses from database
        await db.delete(addresses).where(eq(addresses.userId, testUserId));
        await db.delete(users).where(eq(users.id, testUserId));

        console.log("[CLEANUP] Test user and addresses deleted");
      },
    );
  },
});
