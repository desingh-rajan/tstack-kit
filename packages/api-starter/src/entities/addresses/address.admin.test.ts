/**
 * Address Admin Panel API Tests (BDD Style)
 *
 * Tests admin routes for managing user addresses.
 * Addresses are user-owned entities, so admin access allows
 * viewing and managing addresses across all users.
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { addresses } from "./address.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";
import { users } from "../../auth/user.model.ts";
import { like } from "drizzle-orm";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let superadminToken = "";
let adminToken = "";
let regularUserToken = "";
const _superadminUserId = 0;
let regularUserId = 0;
let testAddressId = "";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function adminRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return await app.request(endpoint, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

async function createTestUser(
  email: string,
  name: string,
  password: string,
  role: "superadmin" | "admin" | "user" = "user"
): Promise<{ token: string; userId: number }> {
  const { hashPassword } = await import("../../shared/utils/password.ts");

  const [user] = await db
    .insert(users)
    .values({
      email,
      username: name.replace(/\s+/g, "").toLowerCase(),
      password: await hashPassword(password),
      role,
      isActive: true,
      isEmailVerified: true,
    })
    .returning();

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

describe("Address Admin Panel API", () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Clean up any leftover test data
    await db.delete(addresses);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

    // Create superadmin user
    const superadmin = await createTestUser(
      "superadmin@test.local",
      "Test Superadmin",
      "SuperSecure123!",
      "superadmin"
    );
    superadminToken = superadmin.token;
    superadminUserId = superadmin.userId;

    // Create admin user
    const admin = await createTestUser(
      "admin@test.local",
      "Test Admin",
      "AdminSecure123!",
      "admin"
    );
    adminToken = admin.token;

    // Create regular user (for testing access control)
    const regularUser = await createTestUser(
      "user@test.local",
      "Regular User",
      "UserSecure123!",
      "user"
    );
    regularUserToken = regularUser.token;
    regularUserId = regularUser.userId;

    // Create a test address for the regular user
    const [address] = await db
      .insert(addresses)
      .values({
        userId: regularUserId,
        label: "Home",
        fullName: "Test User",
        phone: "+91-9876543210",
        addressLine1: "123 Test Street",
        city: "Chennai",
        state: "Tamil Nadu",
        postalCode: "600001",
        country: "India",
        type: "shipping",
        isDefault: true,
      })
      .returning();
    testAddressId = address.id;
  });

  afterAll(async () => {
    await db.delete(addresses);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

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
        "/ts-admin/addresses",
        superadminToken
      );

      assertEquals(response.status, 200);
      assertEquals(
        response.headers.get("content-type")?.split(";")[0],
        "application/json"
      );

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
      assertExists(json.page);
      assertExists(json.total);
    });

    it("should return entity metadata for create form", async () => {
      const response = await adminRequest(
        "/ts-admin/addresses/new",
        superadminToken
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.entityName);
      assertEquals(json.mode, "create");
      assertExists(json.columns);
    });

    it("should support pagination parameters", async () => {
      const response = await adminRequest(
        "/ts-admin/addresses?page=1&limit=10",
        superadminToken
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.page, 1);
      assertEquals(json.limit, 10);
    });

    it("should support search functionality", async () => {
      const response = await adminRequest(
        "/ts-admin/addresses?search=Chennai",
        superadminToken
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.data.length >= 1, true);
    });
  });

  // --------------------------------------------------------------------------
  // GET SINGLE ENTITY
  // --------------------------------------------------------------------------

  describe("Get Single Address", () => {
    it("should return address details by ID", async () => {
      const response = await adminRequest(
        `/ts-admin/addresses/${testAddressId}`,
        superadminToken
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      // HonoAdminAdapter returns entity directly, not wrapped in data
      assertExists(json.id);
      assertEquals(json.id, testAddressId);
      assertEquals(json.city, "Chennai");
    });

    it("should return 404 for non-existent address", async () => {
      const response = await adminRequest(
        "/ts-admin/addresses/00000000-0000-0000-0000-000000000000",
        superadminToken
      );

      assertEquals(response.status, 404);
    });
  });

  // --------------------------------------------------------------------------
  // CREATE ADDRESS
  // --------------------------------------------------------------------------

  describe("Create Address", () => {
    it("should create a new address via admin panel", async () => {
      const response = await adminRequest(
        "/ts-admin/addresses",
        superadminToken,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: regularUserId,
            label: "Office",
            fullName: "Test User Office",
            phone: "+91-9876543211",
            addressLine1: "456 Business Park",
            city: "Bangalore",
            state: "Karnataka",
            postalCode: "560001",
            country: "India",
            type: "billing",
            isDefault: false,
          }),
        }
      );

      assertEquals(response.status, 201);

      const json = await response.json();
      // HonoAdminAdapter returns entity directly
      assertExists(json.id);
      assertEquals(json.city, "Bangalore");
      assertEquals(json.type, "billing");
    });
  });

  // --------------------------------------------------------------------------
  // UPDATE ADDRESS
  // --------------------------------------------------------------------------

  describe("Update Address", () => {
    it("should update an existing address", async () => {
      const response = await adminRequest(
        `/ts-admin/addresses/${testAddressId}`,
        superadminToken,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            city: "Mumbai",
            state: "Maharashtra",
          }),
        }
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      // HonoAdminAdapter returns entity directly
      assertEquals(json.city, "Mumbai");
      assertEquals(json.state, "Maharashtra");
    });
  });

  // --------------------------------------------------------------------------
  // DELETE ADDRESS
  // --------------------------------------------------------------------------

  describe("Delete Address", () => {
    it("should delete an address", async () => {
      // Create address to delete
      const [addressToDelete] = await db
        .insert(addresses)
        .values({
          userId: regularUserId,
          label: "Delete Me",
          fullName: "Delete Test",
          phone: "+91-0000000000",
          addressLine1: "Delete Street",
          city: "Delete City",
          state: "Delete State",
          postalCode: "000000",
          country: "India",
          type: "shipping",
          isDefault: false,
        })
        .returning();

      const response = await adminRequest(
        `/ts-admin/addresses/${addressToDelete.id}`,
        superadminToken,
        { method: "DELETE" }
      );

      assertEquals(response.status, 200);

      // Verify deleted
      const verifyResponse = await adminRequest(
        `/ts-admin/addresses/${addressToDelete.id}`,
        superadminToken
      );
      assertEquals(verifyResponse.status, 404);
    });
  });

  // --------------------------------------------------------------------------
  // ACCESS CONTROL
  // --------------------------------------------------------------------------

  describe("Access Control", () => {
    it("should allow admin users to access", async () => {
      const response = await adminRequest("/ts-admin/addresses", adminToken);

      assertEquals(response.status, 200);
    });

    it("should deny access to regular users", async () => {
      const response = await adminRequest(
        "/ts-admin/addresses",
        regularUserToken
      );

      // HonoAdminAdapter throws error (500) for unauthorized roles
      // The checkAuth middleware returns 500 with "Forbidden: Requires one of: superadmin, admin"
      assertEquals(response.status, 500);
    });

    it("should deny access without authentication", async () => {
      const response = await app.request("/ts-admin/addresses");

      assertEquals(response.status, 401);
    });
  });
});
