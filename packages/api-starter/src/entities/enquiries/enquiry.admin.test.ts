/**
 * Enquiry Admin Panel API Tests (BDD Style)
 *
 * Tests admin routes for managing contact form submissions.
 *
 * TESTING PATTERNS DEMONSTRATED:
 * ================================
 *
 * 1. Admin Panel JSON API Testing:
 *    - List endpoints with pagination/search/sort
 *    - CRUD operations via JSON API
 *    - Bulk operations (delete, mark as spam)
 *
 * 2. Role-Based Access Control:
 *    - Superadmin: Full access to all admin features
 *    - Admin: Access to admin panel (role-based)
 *    - Regular user: No access to admin panel
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { enquiries } from "./enquiry.model.ts";
import { users } from "../../auth/user.model.ts";
import { like } from "drizzle-orm";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let superadminToken = "";
let adminToken = "";
let regularUserToken = "";
let _superadminUserId = 0;
let _adminUserId = 0;
let _regularUserId = 0;
let testEnquiryId = 0;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Makes an authenticated request to the admin panel API
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
 */
async function createTestUser(
  email: string,
  name: string,
  password: string,
  role: "superadmin" | "admin" | "user" = "user",
): Promise<{ token: string; userId: number }> {
  const { hashPassword } = await import("../../shared/utils/password.ts");

  const [user] = await db.insert(users).values({
    email,
    username: name.replace(/\s+/g, "").toLowerCase(),
    password: await hashPassword(password),
    role,
    isActive: true,
    isEmailVerified: true,
  }).returning();

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

/**
 * Creates a test enquiry directly in the database
 */
async function createTestEnquiry(data: {
  name?: string;
  email?: string;
  phone?: string;
  message: string;
  status?: string;
}): Promise<number> {
  const [enquiry] = await db.insert(enquiries).values({
    name: data.name || "Test User",
    email: data.email || "test-enquiry@test.local",
    phone: data.phone || null,
    message: data.message,
    status: data.status || "new",
  }).returning();

  return enquiry.id;
}

// ============================================================================
// ADMIN PANEL API TEST SUITE
// ============================================================================

describe({
  name: "Enquiry Admin Panel API",
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    console.log("\n[SETUP] Creating test users and enquiries...");

    // Clean up any existing test data
    await db.delete(enquiries).where(
      like(enquiries.email, "%@test.local"),
    );
    await db.delete(users).where(like(users.email, "%@test.local"));

    // Create test users
    const superadmin = await createTestUser(
      "enquiry-superadmin@test.local",
      "Enquiry Superadmin",
      "SuperAdmin123!",
      "superadmin",
    );
    superadminToken = superadmin.token;
    _superadminUserId = superadmin.userId;

    const admin = await createTestUser(
      "enquiry-admin@test.local",
      "Enquiry Admin",
      "Admin123!",
      "admin",
    );
    adminToken = admin.token;
    _adminUserId = admin.userId;

    const regular = await createTestUser(
      "enquiry-user@test.local",
      "Enquiry User",
      "User123!",
      "user",
    );
    regularUserToken = regular.token;
    _regularUserId = regular.userId;

    // Create test enquiries
    testEnquiryId = await createTestEnquiry({
      name: "Test Customer",
      email: "customer@test.local",
      message: "I have a question about your services.",
    });

    await createTestEnquiry({
      name: "Another Customer",
      email: "another@test.local",
      message: "Please contact me about pricing.",
      status: "read",
    });

    await createTestEnquiry({
      email: "spam@test.local",
      message: "Buy cheap stuff now!!!",
      status: "spam",
    });

    console.log("[SETUP] Test data created successfully");
  });

  afterAll(async () => {
    console.log("\n[CLEANUP] Removing test data...");
    await db.delete(enquiries).where(
      like(enquiries.email, "%@test.local"),
    );
    await db.delete(users).where(like(users.email, "%@test.local"));
    console.log("[CLEANUP] Done");
  });

  // --------------------------------------------------------------------------
  // AUTHENTICATION TESTS
  // --------------------------------------------------------------------------

  describe("Authentication & Authorization", () => {
    it("should reject unauthenticated requests", async () => {
      const response = await app.request("/ts-admin/enquiries");
      assertEquals(response.status, 401);
    });

    it("should reject regular user access", async () => {
      const response = await adminRequest(
        "/ts-admin/enquiries",
        regularUserToken,
      );
      // May return 403 (Forbidden) or other non-200 error
      assertEquals(response.status !== 200, true);
    });

    it("should allow admin access", async () => {
      const response = await adminRequest("/ts-admin/enquiries", adminToken);
      assertEquals(response.status, 200);
    });

    it("should allow superadmin access", async () => {
      const response = await adminRequest(
        "/ts-admin/enquiries",
        superadminToken,
      );
      assertEquals(response.status, 200);
    });
  });

  // --------------------------------------------------------------------------
  // LIST ENDPOINT TESTS
  // --------------------------------------------------------------------------

  describe("List Enquiries", () => {
    it("should return paginated list of enquiries", async () => {
      const response = await adminRequest(
        "/ts-admin/enquiries",
        superadminToken,
      );
      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
      assertEquals(Array.isArray(json.data), true);
      assertExists(json.page);
      assertExists(json.total);
    });

    it("should support search by email", async () => {
      const response = await adminRequest(
        "/ts-admin/enquiries?search=customer",
        superadminToken,
      );
      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
    });

    it("should support sorting", async () => {
      const response = await adminRequest(
        "/ts-admin/enquiries?sortBy=createdAt&sortOrder=desc",
        superadminToken,
      );
      assertEquals(response.status, 200);

      const json = await response.json();
      assertExists(json.data);
    });
  });

  // --------------------------------------------------------------------------
  // SHOW ENDPOINT TESTS
  // --------------------------------------------------------------------------

  describe("Show Enquiry", () => {
    it("should return enquiry details by ID", async () => {
      const response = await adminRequest(
        `/ts-admin/enquiries/${testEnquiryId}`,
        superadminToken,
      );
      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.id, testEnquiryId);
      assertEquals(json.email, "customer@test.local");
    });

    it("should return 404 for non-existent enquiry", async () => {
      const response = await adminRequest(
        "/ts-admin/enquiries/99999",
        superadminToken,
      );
      assertEquals(response.status, 404);
    });
  });

  // --------------------------------------------------------------------------
  // UPDATE ENDPOINT TESTS
  // --------------------------------------------------------------------------

  describe("Update Enquiry", () => {
    it("should update enquiry status", async () => {
      const response = await adminRequest(
        `/ts-admin/enquiries/${testEnquiryId}`,
        superadminToken,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "read" }),
        },
      );
      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.status, "read");
    });

    it("should update admin notes", async () => {
      const response = await adminRequest(
        `/ts-admin/enquiries/${testEnquiryId}`,
        superadminToken,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminNotes: "Follow up needed" }),
        },
      );
      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.adminNotes, "Follow up needed");
    });
  });

  // --------------------------------------------------------------------------
  // DELETE ENDPOINT TESTS
  // --------------------------------------------------------------------------

  describe("Delete Enquiry", () => {
    let deleteTestId: number;

    beforeAll(async () => {
      deleteTestId = await createTestEnquiry({
        email: "delete-test@test.local",
        message: "This will be deleted",
      });
    });

    it("should delete enquiry", async () => {
      const response = await adminRequest(
        `/ts-admin/enquiries/${deleteTestId}`,
        superadminToken,
        { method: "DELETE" },
      );
      assertEquals(response.status, 200);
    });

    it("should return 404 when deleting non-existent enquiry", async () => {
      const response = await adminRequest(
        `/ts-admin/enquiries/${deleteTestId}`,
        superadminToken,
        { method: "DELETE" },
      );
      assertEquals(response.status, 404);
    });
  });

  // --------------------------------------------------------------------------
  // BULK OPERATIONS TESTS
  // --------------------------------------------------------------------------

  describe("Bulk Operations", () => {
    let bulkTestIds: number[] = [];

    beforeAll(async () => {
      bulkTestIds = [];
      for (let i = 1; i <= 3; i++) {
        const id = await createTestEnquiry({
          email: `bulk-test-${i}@test.local`,
          message: `Bulk test message ${i}`,
        });
        bulkTestIds.push(id);
      }
    });

    it("should bulk delete enquiries", async () => {
      const response = await adminRequest(
        "/ts-admin/enquiries/bulk-delete",
        superadminToken,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: bulkTestIds }),
        },
      );
      assertEquals(response.status, 200);
    });
  });
});
