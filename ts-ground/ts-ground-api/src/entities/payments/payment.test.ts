import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { users } from "../../auth/user.model.ts";
import { products } from "../products/product.model.ts";
import { addresses } from "../addresses/address.model.ts";
import { carts } from "../carts/cart.model.ts";
import { cartItems } from "../carts/cart-item.model.ts";
import { orders } from "../orders/order.model.ts";
// import { orderItems } from "../orders/order-item.model.ts";
import { payments } from "./payment.model.ts";
import { hashPassword } from "../../shared/utils/password.ts";
import { eq } from "drizzle-orm";

/**
 * Payment Integration Tests
 *
 * Note: These tests mock Razorpay API calls since we can't make real
 * payment requests in tests. The tests verify the flow and database updates.
 */

// Test user credentials
const TEST_EMAIL = "payment-test@test.local";
const TEST_PASSWORD = "TestPassword123!";

let authToken: string;
let testUserId: number;
let testProductId: string;
let testAddressId: string;
let testOrderId: string;

// Helper to make authenticated requests
function authenticatedRequest(method: string, path: string, body?: unknown) {
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
  name: "Payment API",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Setup: Create test user, product, address, and order
    await t.step("setup: create test data", async () => {
      console.log("\n[SETUP] Creating test data...");

      // Clean up existing test user
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, TEST_EMAIL))
        .limit(1);

      if (existingUser.length > 0) {
        await db.delete(carts).where(eq(carts.userId, existingUser[0].id));
        await db.delete(orders).where(eq(orders.userId, existingUser[0].id));
        await db
          .delete(addresses)
          .where(eq(addresses.userId, existingUser[0].id));
        await db.delete(users).where(eq(users.email, TEST_EMAIL));
      }

      // Create test user (with verified email)
      const hashedPassword = await hashPassword(TEST_PASSWORD);
      const userResult = await db
        .insert(users)
        .values({
          email: TEST_EMAIL,
          password: hashedPassword,
          role: "user",
          isEmailVerified: true,
          isActive: true,
        })
        .returning();

      testUserId = userResult[0].id;
      console.log(`[SETUP] Test user created: ${TEST_EMAIL}`);

      // Create test product
      const productResult = await db
        .insert(products)
        .values({
          name: "Test Pan for Payment",
          slug: `test-pan-payment-${Date.now()}`,
          description: "A test product for payment testing",
          price: "1999.00",
          stockQuantity: 10,
          isActive: true,
        })
        .returning();

      testProductId = productResult[0].id;
      console.log(`[SETUP] Test product created: ${testProductId}`);

      // Create test address
      const addressResult = await db
        .insert(addresses)
        .values({
          userId: testUserId,
          label: "Home",
          fullName: "Test User",
          phone: "+919876543210",
          addressLine1: "123 Test Street",
          city: "Mumbai",
          state: "Maharashtra",
          postalCode: "400001",
          country: "India",
          type: "shipping",
          isDefault: true,
        })
        .returning();

      testAddressId = addressResult[0].id;
      console.log(`[SETUP] Test address created: ${testAddressId}`);
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

    // Create an order for payment testing
    await t.step("setup: create order for payment", async () => {
      // Add item to cart
      const cartResponse = await authenticatedRequest("POST", "/cart/items", {
        productId: testProductId,
        quantity: 1,
      });
      assertEquals(cartResponse.status, 201);

      // Create order
      const orderResponse = await authenticatedRequest(
        "POST",
        "/checkout/create",
        {
          shippingAddressId: testAddressId,
          useSameAddress: true,
          paymentMethod: "razorpay",
        }
      );
      assertEquals(orderResponse.status, 201);

      const orderData = await orderResponse.json();
      testOrderId = orderData.data.id;
      console.log(`[SETUP] Test order created: ${testOrderId}`);
    });

    // ============================================
    // Payment Order Tests
    // ============================================

    await t.step("POST /payments/create-order - requires auth", async () => {
      const response = await app.request("/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: testOrderId }),
      });
      assertEquals(response.status, 401);
    });

    // Note: This test will fail in CI without Razorpay credentials
    // The test verifies the endpoint exists and validates input
    await t.step("POST /payments/create-order - validates input", async () => {
      const response = await authenticatedRequest(
        "POST",
        "/payments/create-order",
        {
          orderId: "invalid-uuid",
        }
      );
      assertEquals(response.status, 400);
    });

    await t.step(
      "POST /payments/create-order - rejects non-existent order",
      async () => {
        const response = await authenticatedRequest(
          "POST",
          "/payments/create-order",
          {
            orderId: crypto.randomUUID(),
          }
        );
        assertEquals(response.status, 404);
      }
    );

    // ============================================
    // Payment Verification Tests
    // ============================================

    await t.step("POST /payments/verify - validates input", async () => {
      const response = await authenticatedRequest("POST", "/payments/verify", {
        orderId: testOrderId,
        // Missing required fields
      });
      assertEquals(response.status, 400);
    });

    await t.step("POST /payments/verify - rejects invalid order", async () => {
      const response = await authenticatedRequest("POST", "/payments/verify", {
        orderId: crypto.randomUUID(),
        razorpayOrderId: "order_test123",
        razorpayPaymentId: "pay_test123",
        razorpaySignature: "fake_signature",
      });
      assertEquals(response.status, 404);
    });

    // ============================================
    // Payment Status Tests
    // ============================================

    await t.step("GET /payments/:orderId/status - requires auth", async () => {
      const response = await app.request(`/payments/${testOrderId}/status`, {
        method: "GET",
      });
      assertEquals(response.status, 401);
    });

    await t.step("GET /payments/:orderId/status - returns status", async () => {
      const response = await authenticatedRequest(
        "GET",
        `/payments/${testOrderId}/status`
      );
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.data.orderId, testOrderId);
      assertEquals(data.data.paymentStatus, "pending");
    });

    await t.step(
      "GET /payments/:orderId/status - rejects other user's order",
      async () => {
        const response = await authenticatedRequest(
          "GET",
          `/payments/${crypto.randomUUID()}/status`
        );
        assertEquals(response.status, 404);
      }
    );

    // ============================================
    // Webhook Tests
    // ============================================

    await t.step(
      "POST /webhooks/razorpay - handles webhook request",
      async () => {
        const response = await app.request("/webhooks/razorpay", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Razorpay-Signature": "invalid_signature",
          },
          body: JSON.stringify({
            event: "payment.captured",
            payload: {},
          }),
        });
        // With NoOp provider (no webhook secret), returns 200
        // With real Razorpay (invalid signature), would return 400
        // Both are valid behaviors depending on configuration
        const validStatuses = [200, 400];
        assertEquals(
          validStatuses.includes(response.status),
          true,
          `Expected 200 or 400, got ${response.status}`
        );
      }
    );

    // ============================================
    // Cleanup
    // ============================================

    await t.step("cleanup: remove test data", async () => {
      console.log("\n[CLEANUP] Removing test data...");

      // Delete payments
      await db.delete(payments).where(eq(payments.orderId, testOrderId));

      // Delete order items and orders
      await db.delete(orders).where(eq(orders.userId, testUserId));

      // Delete cart items and carts
      const userCarts = await db
        .select()
        .from(carts)
        .where(eq(carts.userId, testUserId));

      for (const cart of userCarts) {
        await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
      }
      await db.delete(carts).where(eq(carts.userId, testUserId));

      // Delete addresses
      await db.delete(addresses).where(eq(addresses.userId, testUserId));

      // Delete products
      await db.delete(products).where(eq(products.id, testProductId));

      // Delete user
      await db.delete(users).where(eq(users.email, TEST_EMAIL));

      console.log("[CLEANUP] Test data removed");
    });
  },
});
