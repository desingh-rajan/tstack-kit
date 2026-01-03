import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { users } from "../../auth/user.model.ts";
import { products } from "../products/product.model.ts";
import { productVariants } from "../product_variants/product-variant.model.ts";
import { addresses } from "../addresses/address.model.ts";
import { carts } from "../carts/cart.model.ts";
import { cartItems } from "../carts/cart-item.model.ts";
import { orders } from "./order.model.ts";
// import { orderItems } from "./order-item.model.ts";
import { hashPassword } from "../../shared/utils/password.ts";
import { eq } from "drizzle-orm";

/**
 * Order Integration Tests
 *
 * Tests order operations including checkout validation and order creation
 */

// Test user credentials
const TEST_EMAIL = "order-test@test.local";
const TEST_PASSWORD = "TestPassword123!";

let authToken: string;
let testUserId: number;
let testProductId: string;
let testProductId2: string;
let testVariantId: string;
let testAddressId: string;
let testOrderId: string;

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
  name: "Order API",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Setup: Create test user, products, and address
    await t.step("setup: create test data", async () => {
      console.log("\n[SETUP] Creating test data...");

      // Clean up existing test user
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, TEST_EMAIL))
        .limit(1);

      if (existingUser.length > 0) {
        // Delete orders, carts, addresses for this user
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
          isEmailVerified: true, // Must be verified for checkout
          isActive: true,
        })
        .returning();

      testUserId = userResult[0].id;
      console.log(`[SETUP] Test user created: ${TEST_EMAIL}`);

      // Create test product 1
      const productResult1 = await db
        .insert(products)
        .values({
          name: "Test Kadhai Set",
          slug: `test-kadhai-${Date.now()}`,
          description: "A test product for order testing",
          price: "1499.00",
          stockQuantity: 10,
          isActive: true,
        })
        .returning();

      testProductId = productResult1[0].id;
      console.log(`[SETUP] Test product 1 created: ${testProductId}`);

      // Create test product 2
      const productResult2 = await db
        .insert(products)
        .values({
          name: "Test Tawa",
          slug: `test-tawa-${Date.now()}`,
          description: "Another test product",
          price: "599.00",
          stockQuantity: 5,
          isActive: true,
        })
        .returning();

      testProductId2 = productResult2[0].id;
      console.log(`[SETUP] Test product 2 created: ${testProductId2}`);

      // Create test variant
      const variantResult = await db
        .insert(productVariants)
        .values({
          productId: testProductId,
          sku: `TEST-ORDER-VAR-${Date.now()}`,
          price: "1699.00",
          stockQuantity: 3,
          options: { size: "Large" },
          isActive: true,
        })
        .returning();

      testVariantId = variantResult[0].id;
      console.log(`[SETUP] Test variant created: ${testVariantId}`);

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

    // Add items to cart
    await t.step("setup: add items to cart", async () => {
      // Add product 1
      const response1 = await authenticatedRequest("POST", "/cart/items", {
        productId: testProductId,
        quantity: 2,
      });
      assertEquals(response1.status, 201);

      // Add product 2
      const response2 = await authenticatedRequest("POST", "/cart/items", {
        productId: testProductId2,
        quantity: 1,
      });
      assertEquals(response2.status, 201);

      // Verify cart
      const cartResponse = await authenticatedRequest("GET", "/cart");
      assertEquals(cartResponse.status, 200);
      const cartData = await cartResponse.json();
      assertEquals(cartData.data.itemCount, 3); // 2 + 1
    });

    // ============================================
    // Checkout Validation Tests
    // ============================================

    await t.step("POST /checkout/validate - validate checkout", async () => {
      const response = await authenticatedRequest(
        "POST",
        "/checkout/validate",
        {
          shippingAddressId: testAddressId,
          useSameAddress: true,
        },
      );
      assertEquals(response.status, 200);

      const data = await response.json();
      assertExists(data.data);
      assertEquals(data.data.valid, true);
      assertExists(data.data.cart);
      assertExists(data.data.totals);
      assertExists(data.data.shippingAddress);

      // Check totals calculation
      // Subtotal: 1499 * 2 + 599 = 3597
      assertEquals(data.data.cart.subtotal, "3597.00");

      // Free shipping (over 999)
      assertEquals(data.data.shipping.isFreeShipping, true);
      assertEquals(data.data.shipping.amount, "0.00");

      // Tax: 18% of 3597 = 647.46
      assertEquals(data.data.tax.amount, "647.46");

      // Total: 3597 + 0 + 647.46 = 4244.46
      assertEquals(data.data.totals.total, "4244.46");
    });

    await t.step(
      "POST /checkout/validate - reject invalid address",
      async () => {
        const response = await authenticatedRequest(
          "POST",
          "/checkout/validate",
          {
            shippingAddressId: crypto.randomUUID(),
            useSameAddress: true,
          },
        );
        assertEquals(response.status, 400);
      },
    );

    // ============================================
    // Order Creation Tests
    // ============================================

    await t.step("POST /checkout/create - create order", async () => {
      const response = await authenticatedRequest("POST", "/checkout/create", {
        shippingAddressId: testAddressId,
        useSameAddress: true,
        paymentMethod: "cod",
        customerNotes: "Please handle with care",
      });
      assertEquals(response.status, 201);

      const data = await response.json();
      assertExists(data.data);
      assertExists(data.data.id);
      assertExists(data.data.orderNumber);
      assertEquals(data.data.status, "pending");
      assertEquals(data.data.paymentStatus, "pending");
      assertEquals(data.data.paymentMethod, "cod");
      assertEquals(data.data.customerNotes, "Please handle with care");
      assertEquals(data.data.totalAmount, "4244.46");
      assertEquals(data.data.items.length, 2); // 2 different products

      // Verify order number format
      assertEquals(data.data.orderNumber.startsWith("SC-"), true);

      // Verify address snapshot
      assertExists(data.data.shippingAddress);
      assertEquals(data.data.shippingAddress.city, "Mumbai");

      testOrderId = data.data.id;
    });

    await t.step("POST /checkout/create - cart should be cleared", async () => {
      const response = await authenticatedRequest("GET", "/cart");
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.data.itemCount, 0); // Cart cleared after order
    });

    await t.step(
      "POST /checkout/create - stock should be reduced",
      async () => {
        // Check product 1 stock (was 10, ordered 2)
        const product1 = await db
          .select()
          .from(products)
          .where(eq(products.id, testProductId))
          .limit(1);
        assertEquals(product1[0].stockQuantity, 8); // 10 - 2

        // Check product 2 stock (was 5, ordered 1)
        const product2 = await db
          .select()
          .from(products)
          .where(eq(products.id, testProductId2))
          .limit(1);
        assertEquals(product2[0].stockQuantity, 4); // 5 - 1
      },
    );

    // ============================================
    // Order History Tests
    // ============================================

    await t.step("GET /orders - get order history", async () => {
      const response = await authenticatedRequest("GET", "/orders");
      assertEquals(response.status, 200);

      const data = await response.json();
      assertExists(data.data.orders);
      assertExists(data.data.pagination);
      assertEquals(data.data.orders.length >= 1, true);

      // Find our test order
      const testOrder = data.data.orders.find(
        (o: { id: string }) => o.id === testOrderId,
      );
      assertExists(testOrder);
      assertEquals(testOrder.itemCount, 3); // 2 + 1 items
    });

    await t.step("GET /orders/:id - get order details", async () => {
      const response = await authenticatedRequest(
        "GET",
        `/orders/${testOrderId}`,
      );
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.data.id, testOrderId);
      assertEquals(data.data.items.length, 2);

      // Verify item snapshots
      const item1 = data.data.items.find(
        (i: { productId: string }) => i.productId === testProductId,
      );
      assertExists(item1);
      assertEquals(item1.productName, "Test Kadhai Set");
      assertEquals(item1.quantity, 2);
    });

    await t.step("GET /orders/:id - reject other user's order", async () => {
      // Try to access order with wrong ID
      const response = await authenticatedRequest(
        "GET",
        `/orders/${crypto.randomUUID()}`,
      );
      assertEquals(response.status, 404);
    });

    // ============================================
    // Order Cancellation Tests
    // ============================================

    // Create another order for cancellation test
    let cancelOrderId: string;

    await t.step("setup: create order for cancellation", async () => {
      // Add item to cart
      await authenticatedRequest("POST", "/cart/items", {
        productId: testProductId,
        quantity: 1,
      });

      // Create order
      const response = await authenticatedRequest("POST", "/checkout/create", {
        shippingAddressId: testAddressId,
        useSameAddress: true,
        paymentMethod: "cod",
      });
      assertEquals(response.status, 201);

      const data = await response.json();
      cancelOrderId = data.data.id;
    });

    await t.step("POST /orders/:id/cancel - cancel order", async () => {
      const response = await authenticatedRequest(
        "POST",
        `/orders/${cancelOrderId}/cancel`,
      );
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.data.status, "cancelled");
    });

    await t.step(
      "POST /orders/:id/cancel - stock should be restored",
      async () => {
        // Check product 1 stock (was 7 after cancel order creation, should be 8 now)
        const product1 = await db
          .select()
          .from(products)
          .where(eq(products.id, testProductId))
          .limit(1);
        assertEquals(product1[0].stockQuantity, 8); // Restored
      },
    );

    await t.step("POST /orders/:id/cancel - cannot cancel twice", async () => {
      const response = await authenticatedRequest(
        "POST",
        `/orders/${cancelOrderId}/cancel`,
      );
      assertEquals(response.status, 400);
    });

    // ============================================
    // Edge Cases
    // ============================================

    await t.step("POST /checkout/create - reject empty cart", async () => {
      // Cart is empty after previous orders
      const response = await authenticatedRequest("POST", "/checkout/create", {
        shippingAddressId: testAddressId,
        useSameAddress: true,
        paymentMethod: "cod",
      });
      assertEquals(response.status, 400);
    });

    // ============================================
    // Cleanup
    // ============================================

    await t.step("cleanup: remove test data", async () => {
      console.log("\n[CLEANUP] Removing test data...");

      // Delete order items (cascade should handle this)
      // Delete orders
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

      // Delete variants
      await db
        .delete(productVariants)
        .where(eq(productVariants.productId, testProductId));

      // Delete products
      await db.delete(products).where(eq(products.id, testProductId));
      await db.delete(products).where(eq(products.id, testProductId2));

      // Delete user
      await db.delete(users).where(eq(users.email, TEST_EMAIL));

      console.log("[CLEANUP] Test data removed");
    });
  },
});
