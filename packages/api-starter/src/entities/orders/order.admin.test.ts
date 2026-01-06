/**
 * Order Admin Panel API Tests (BDD Style)
 *
 * Tests admin routes for managing orders.
 * Note: Order admin uses custom controller (not HonoAdminAdapter)
 *
 * Available endpoints:
 * - GET  /ts-admin/orders           - List all orders
 * - GET  /ts-admin/orders/:id       - Get order details
 * - PUT  /ts-admin/orders/:id/status - Update order status
 */

import { afterAll, beforeAll, describe, it } from "@std/testing/bdd";
import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { orders } from "./order.model.ts";
import { addresses } from "../addresses/address.model.ts";
import { authTokens } from "../../auth/auth-token.model.ts";
import { users } from "../../auth/user.model.ts";
import { like } from "drizzle-orm";

// ============================================================================
// MODULE-LEVEL STATE
// ============================================================================

let superadminToken = "";
let adminToken = "";
let regularUserToken = "";
let regularUserId = 0;
let testOrderId = "";
let testAddressId = "";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

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

async function createTestUser(
  email: string,
  name: string,
  password: string,
  role: "superadmin" | "admin" | "user" = "user",
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

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(Math.random() * 99999)
    .toString()
    .padStart(5, "0");
  return `TS-${dateStr}-${random}`;
}

// ============================================================================
// ADMIN PANEL API TEST SUITE
// ============================================================================

describe({
  name: "Order Admin Panel API",
  sanitizeResources: false,
  sanitizeOps: false,
}, () => {
  // --------------------------------------------------------------------------
  // SETUP & TEARDOWN
  // --------------------------------------------------------------------------

  beforeAll(async () => {
    // Clean up any leftover test data
    await db.delete(orders);
    await db.delete(addresses);
    await db.delete(authTokens);
    await db.delete(users).where(like(users.email, "%@test.local"));

    // Create superadmin user
    const superadmin = await createTestUser(
      "superadmin@test.local",
      "Test Superadmin",
      "SuperSecure123!",
      "superadmin",
    );
    superadminToken = superadmin.token;

    // Create admin user
    const admin = await createTestUser(
      "admin@test.local",
      "Test Admin",
      "AdminSecure123!",
      "admin",
    );
    adminToken = admin.token;

    // Create regular user
    const regularUser = await createTestUser(
      "user@test.local",
      "Regular User",
      "UserSecure123!",
      "user",
    );
    regularUserToken = regularUser.token;
    regularUserId = regularUser.userId;

    // Create a test address
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

    // Create a test order
    const [order] = await db
      .insert(orders)
      .values({
        orderNumber: generateOrderNumber(),
        userId: regularUserId,
        subtotal: "1000.00",
        taxAmount: "180.00",
        shippingAmount: "50.00",
        discountAmount: "0.00",
        totalAmount: "1230.00",
        status: "pending",
        paymentStatus: "pending",
        shippingAddressId: testAddressId,
        shippingAddressSnapshot: {
          fullName: "Test User",
          phone: "+91-9876543210",
          addressLine1: "123 Test Street",
          city: "Chennai",
          state: "Tamil Nadu",
          postalCode: "600001",
          country: "India",
        },
      })
      .returning();
    testOrderId = order.id;
  });

  afterAll(async () => {
    await db.delete(orders);
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
  // LIST ORDERS
  // --------------------------------------------------------------------------

  describe({
    name: "List Orders",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return list of all orders", async () => {
      const response = await adminRequest("/ts-admin/orders", superadminToken);

      assertEquals(response.status, 200);

      const json = await response.json();
      // Custom controller returns { success, data: { orders, pagination } }
      assertEquals(json.success, true);
      assertExists(json.data);
      assertExists(json.data.orders);
      assertEquals(Array.isArray(json.data.orders), true);
      assertEquals(json.data.orders.length >= 1, true);
      assertExists(json.data.pagination);
    });

    it("should support filtering by status", async () => {
      const response = await adminRequest(
        "/ts-admin/orders?status=pending",
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.success, true);
      // All returned orders should be pending
      for (const order of json.data.orders) {
        assertEquals(order.status, "pending");
      }
    });

    it("should support pagination", async () => {
      const response = await adminRequest(
        "/ts-admin/orders?page=1&limit=10",
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.success, true);
      assertExists(json.data.orders);
      assertExists(json.data.pagination);
      assertEquals(json.data.pagination.page, 1);
      assertEquals(json.data.pagination.limit, 10);
    });
  });

  // --------------------------------------------------------------------------
  // GET SINGLE ORDER
  // --------------------------------------------------------------------------

  describe({
    name: "Get Single Order",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should return order details by ID", async () => {
      const response = await adminRequest(
        `/ts-admin/orders/${testOrderId}`,
        superadminToken,
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.success, true);
      assertExists(json.data);
      assertEquals(json.data.id, testOrderId);
      assertEquals(json.data.status, "pending");
    });

    it("should return 404 for non-existent order", async () => {
      const response = await adminRequest(
        "/ts-admin/orders/00000000-0000-0000-0000-000000000000",
        superadminToken,
      );

      assertEquals(response.status, 404);
    });
  });

  // --------------------------------------------------------------------------
  // UPDATE ORDER STATUS
  // --------------------------------------------------------------------------

  describe({
    name: "Update Order Status",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should update order status via PUT /status endpoint", async () => {
      const response = await adminRequest(
        `/ts-admin/orders/${testOrderId}/status`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "confirmed",
            adminNotes: "Order confirmed by admin",
          }),
        },
      );

      assertEquals(response.status, 200);

      const json = await response.json();
      assertEquals(json.success, true);
      assertEquals(json.data.status, "confirmed");
    });

    it("should reject invalid status values", async () => {
      const response = await adminRequest(
        `/ts-admin/orders/${testOrderId}/status`,
        superadminToken,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "invalid_status",
          }),
        },
      );

      // Should return 400 Bad Request for invalid status
      assertEquals(response.status, 400);
    });
  });

  // --------------------------------------------------------------------------
  // ACCESS CONTROL
  // --------------------------------------------------------------------------

  describe({
    name: "Access Control",
    sanitizeResources: false,
    sanitizeOps: false,
  }, () => {
    it("should allow admin users to list orders", async () => {
      const response = await adminRequest("/ts-admin/orders", adminToken);

      assertEquals(response.status, 200);
    });

    it("should deny access to regular users", async () => {
      const response = await adminRequest("/ts-admin/orders", regularUserToken);

      // requireAdmin middleware returns 403
      assertEquals(response.status, 403);
    });

    it("should deny access without authentication", async () => {
      const response = await app.request("/ts-admin/orders");

      assertEquals(response.status, 401);
    });
  });
});
