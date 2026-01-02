import { assertEquals, assertExists } from "@std/assert";
import { app } from "../../main.ts";
import { db } from "../../config/database.ts";
import { users } from "../../auth/user.model.ts";
import { products } from "../products/product.model.ts";
import { productVariants } from "../product_variants/product-variant.model.ts";
import { carts } from "./cart.model.ts";
import { cartItems } from "./cart-item.model.ts";
import { hashPassword } from "../../shared/utils/password.ts";
import { eq } from "drizzle-orm";

/**
 * Cart Integration Tests
 *
 * Tests cart operations for both authenticated and guest users
 */

// Test user credentials
const TEST_EMAIL = "cart-test@test.local";
const TEST_PASSWORD = "TestPassword123!";

let authToken: string;
let testUserId: number;
let testProductId: string;
let testProductId2: string;
let testVariantId: string;
let _guestCartId: string;
let _userCartId: string;
let cartItemId: string;

// Helper to make authenticated requests
function authenticatedRequest(
  method: string,
  path: string,
  body?: unknown,
  guestId?: string
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };
  if (guestId) {
    headers["x-guest-id"] = guestId;
  }

  const options: RequestInit = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return app.request(path, options);
}

// Helper to make guest requests (unauthenticated)
function guestRequest(
  method: string,
  path: string,
  body?: unknown,
  guestId?: string
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (guestId) {
    headers["x-guest-id"] = guestId;
  }

  const options: RequestInit = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  return app.request(path, options);
}

Deno.test({
  name: "Cart API",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn(t) {
    // Setup: Create test user and products
    await t.step("setup: create test user and products", async () => {
      console.log("\n[SETUP] Creating test data...");

      // Clean up existing test user
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, TEST_EMAIL))
        .limit(1);

      if (existingUser.length > 0) {
        // Delete carts for this user first
        await db.delete(carts).where(eq(carts.userId, existingUser[0].id));
        await db.delete(users).where(eq(users.email, TEST_EMAIL));
      }

      // Create test user
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

      // Create test product 1
      const productResult1 = await db
        .insert(products)
        .values({
          name: "Test Cookware Set",
          slug: `test-cookware-${Date.now()}`,
          description: "A test product for cart testing",
          price: "999.00",
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
          name: "Test Frying Pan",
          slug: `test-pan-${Date.now()}`,
          description: "Another test product",
          price: "499.00",
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
          sku: `TEST-VAR-${Date.now()}`,
          price: "1099.00",
          stockQuantity: 3,
          options: { size: "Large", color: "Red" },
          isActive: true,
        })
        .returning();

      testVariantId = variantResult[0].id;
      console.log(`[SETUP] Test variant created: ${testVariantId}`);
    });

    // Setup: Login to get auth token
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
    // Guest Cart Tests
    // ============================================

    await t.step("GET /cart - create new guest cart", async () => {
      const testGuestId = crypto.randomUUID();
      const response = await guestRequest(
        "GET",
        "/cart",
        undefined,
        testGuestId
      );
      assertEquals(response.status, 200);

      const data = await response.json();
      assertExists(data.data);
      assertExists(data.data.id);
      assertEquals(data.data.guestId, testGuestId);
      assertEquals(data.data.userId, null);
      assertEquals(data.data.items.length, 0);
      assertEquals(data.data.itemCount, 0);
      assertEquals(data.data.subtotal, "0.00");

      _guestCartId = data.data.id;
    });

    await t.step("POST /cart/items - add item to guest cart", async () => {
      const testGuestId = crypto.randomUUID();

      // First get/create cart
      await guestRequest("GET", "/cart", undefined, testGuestId);

      // Add item
      const response = await guestRequest(
        "POST",
        "/cart/items",
        {
          productId: testProductId,
          quantity: 2,
        },
        testGuestId
      );

      assertEquals(response.status, 201);
      const data = await response.json();
      assertExists(data.data);
      assertExists(data.data.id);
      assertEquals(data.data.productId, testProductId);
      assertEquals(data.data.quantity, 2);
      assertEquals(data.data.priceAtAdd, "999.00");
      assertEquals(data.data.currentPrice, "999.00");
      assertEquals(data.data.priceChanged, false);
      assertEquals(data.data.lineTotal, "1998.00");
    });

    await t.step("POST /cart/items - add variant to guest cart", async () => {
      const testGuestId = crypto.randomUUID();

      // First get/create cart
      await guestRequest("GET", "/cart", undefined, testGuestId);

      // Add variant item
      const response = await guestRequest(
        "POST",
        "/cart/items",
        {
          productId: testProductId,
          variantId: testVariantId,
          quantity: 1,
        },
        testGuestId
      );

      assertEquals(response.status, 201);
      const data = await response.json();
      assertEquals(data.data.productId, testProductId);
      assertEquals(data.data.variantId, testVariantId);
      assertEquals(data.data.priceAtAdd, "1099.00");
    });

    await t.step("POST /cart/items - reject exceeding stock", async () => {
      const testGuestId = crypto.randomUUID();

      // First get/create cart
      await guestRequest("GET", "/cart", undefined, testGuestId);

      // Try to add more than available stock
      const response = await guestRequest(
        "POST",
        "/cart/items",
        {
          productId: testProductId,
          quantity: 100, // More than stock (10)
        },
        testGuestId
      );

      assertEquals(response.status, 400);
      const data = await response.json();
      assertEquals(data.status, "error");
    });

    // ============================================
    // Authenticated User Cart Tests
    // ============================================

    await t.step("GET /cart - create new user cart", async () => {
      const response = await authenticatedRequest("GET", "/cart");
      assertEquals(response.status, 200);

      const data = await response.json();
      assertExists(data.data);
      assertExists(data.data.id);
      assertEquals(data.data.userId, testUserId);
      assertEquals(data.data.guestId, null);
      assertEquals(data.data.items.length, 0);

      _userCartId = data.data.id;
    });

    await t.step("POST /cart/items - add item to user cart", async () => {
      const response = await authenticatedRequest("POST", "/cart/items", {
        productId: testProductId,
        quantity: 1,
      });

      assertEquals(response.status, 201);
      const data = await response.json();
      assertExists(data.data.id);
      assertEquals(data.data.productId, testProductId);
      assertEquals(data.data.quantity, 1);

      cartItemId = data.data.id;
    });

    await t.step("POST /cart/items - increment existing item", async () => {
      // Add same product again
      const response = await authenticatedRequest("POST", "/cart/items", {
        productId: testProductId,
        quantity: 2,
      });

      assertEquals(response.status, 201);
      const data = await response.json();
      assertEquals(data.data.quantity, 3); // 1 + 2 = 3
    });

    await t.step("POST /cart/items - add second product", async () => {
      const response = await authenticatedRequest("POST", "/cart/items", {
        productId: testProductId2,
        quantity: 1,
      });

      assertEquals(response.status, 201);
      const data = await response.json();
      assertEquals(data.data.productId, testProductId2);
      assertEquals(data.data.quantity, 1);
    });

    await t.step("GET /cart - verify cart totals", async () => {
      const response = await authenticatedRequest("GET", "/cart");
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.data.items.length, 2);
      assertEquals(data.data.itemCount, 4); // 3 + 1
      assertEquals(data.data.uniqueItemCount, 2);
      // 3 * 999 + 1 * 499 = 2997 + 499 = 3496
      assertEquals(data.data.subtotal, "3496.00");
    });

    await t.step("GET /cart/count - get cart count", async () => {
      const response = await authenticatedRequest("GET", "/cart/count");
      assertEquals(response.status, 200);

      const data = await response.json();
      assertEquals(data.data.itemCount, 4);
      assertEquals(data.data.uniqueItemCount, 2);
    });

    await t.step("PUT /cart/items/:id - update quantity", async () => {
      const response = await authenticatedRequest(
        "PUT",
        `/cart/items/${cartItemId}`,
        { quantity: 5 }
      );

      assertEquals(response.status, 200);
      const data = await response.json();
      assertEquals(data.data.quantity, 5);
    });

    await t.step("PUT /cart/items/:id - reject exceeding stock", async () => {
      const response = await authenticatedRequest(
        "PUT",
        `/cart/items/${cartItemId}`,
        { quantity: 100 } // More than stock (10)
      );

      assertEquals(response.status, 400);
    });

    await t.step("GET /cart/validate - validate stock", async () => {
      const response = await authenticatedRequest("GET", "/cart/validate");
      assertEquals(response.status, 200);

      const data = await response.json();
      assertExists(data.data);
      assertExists(typeof data.data.valid, "boolean");
      assertExists(Array.isArray(data.data.issues));
    });

    await t.step("DELETE /cart/items/:id - remove item", async () => {
      // Get current cart to find an item ID
      const cartResponse = await authenticatedRequest("GET", "/cart");
      const cartData = await cartResponse.json();
      const itemToRemove = cartData.data.items.find(
        (item: { productId: string }) => item.productId === testProductId2
      );

      const response = await authenticatedRequest(
        "DELETE",
        `/cart/items/${itemToRemove.id}`
      );
      assertEquals(response.status, 200);

      // Verify item removed
      const verifyResponse = await authenticatedRequest("GET", "/cart");
      const verifyData = await verifyResponse.json();
      assertEquals(verifyData.data.items.length, 1);
    });

    await t.step("DELETE /cart - clear cart", async () => {
      const response = await authenticatedRequest("DELETE", "/cart");
      assertEquals(response.status, 200);

      // Verify cart is empty
      const verifyResponse = await authenticatedRequest("GET", "/cart");
      const verifyData = await verifyResponse.json();
      assertEquals(verifyData.data.items.length, 0);
      assertEquals(verifyData.data.itemCount, 0);
    });

    // ============================================
    // Cart Merge Tests
    // ============================================

    await t.step("POST /cart/merge - merge guest cart on login", async () => {
      // Create a new guest ID and add items to guest cart
      const mergeGuestId = crypto.randomUUID();

      // Add item to guest cart
      await guestRequest(
        "POST",
        "/cart/items",
        {
          productId: testProductId,
          quantity: 2,
        },
        mergeGuestId
      );

      // Verify guest cart has items
      const guestCartResponse = await guestRequest(
        "GET",
        "/cart",
        undefined,
        mergeGuestId
      );
      const guestCartData = await guestCartResponse.json();
      assertEquals(guestCartData.data.itemCount, 2);

      // Now merge into user cart (user is authenticated)
      const mergeResponse = await authenticatedRequest("POST", "/cart/merge", {
        guestId: mergeGuestId,
      });

      assertEquals(mergeResponse.status, 200);
      const mergeData = await mergeResponse.json();
      assertEquals(mergeData.data.userId, testUserId);
      assertEquals(mergeData.data.itemCount, 2);
    });

    await t.step("POST /cart/merge - add to existing user cart", async () => {
      // User already has 2 items from previous test
      // Create another guest cart with different product
      const newGuestId = crypto.randomUUID();

      await guestRequest(
        "POST",
        "/cart/items",
        {
          productId: testProductId2,
          quantity: 1,
        },
        newGuestId
      );

      // Merge
      const mergeResponse = await authenticatedRequest("POST", "/cart/merge", {
        guestId: newGuestId,
      });

      assertEquals(mergeResponse.status, 200);
      const mergeData = await mergeResponse.json();
      assertEquals(mergeData.data.itemCount, 3); // 2 + 1
      assertEquals(mergeData.data.uniqueItemCount, 2); // 2 different products
    });

    // ============================================
    // Edge Cases
    // ============================================

    await t.step("POST /cart/items - reject invalid product", async () => {
      const response = await authenticatedRequest("POST", "/cart/items", {
        productId: crypto.randomUUID(), // Non-existent product
        quantity: 1,
      });

      assertEquals(response.status, 400);
    });

    await t.step("POST /cart/items - reject invalid variant", async () => {
      const response = await authenticatedRequest("POST", "/cart/items", {
        productId: testProductId,
        variantId: crypto.randomUUID(), // Non-existent variant
        quantity: 1,
      });

      assertEquals(response.status, 400);
    });

    await t.step("PUT /cart/items/:id - reject non-existent item", async () => {
      const response = await authenticatedRequest(
        "PUT",
        `/cart/items/${crypto.randomUUID()}`,
        { quantity: 1 }
      );

      assertEquals(response.status, 404);
    });

    await t.step(
      "DELETE /cart/items/:id - reject non-existent item",
      async () => {
        const response = await authenticatedRequest(
          "DELETE",
          `/cart/items/${crypto.randomUUID()}`
        );

        assertEquals(response.status, 404);
      }
    );

    // ============================================
    // Cleanup
    // ============================================

    await t.step("cleanup: remove test data", async () => {
      console.log("\n[CLEANUP] Removing test data...");

      // Delete cart items first (foreign key constraint)
      await db.delete(cartItems).where(eq(cartItems.productId, testProductId));
      await db.delete(cartItems).where(eq(cartItems.productId, testProductId2));

      // Delete carts
      await db.delete(carts).where(eq(carts.userId, testUserId));

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
