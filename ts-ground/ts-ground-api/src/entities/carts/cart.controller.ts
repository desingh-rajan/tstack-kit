import { Context } from "hono";
import { cartService } from "./cart.service.ts";
import { BadRequestError, NotFoundError } from "../../shared/utils/errors.ts";
import {
  AddCartItemSchema,
  MergeCartsSchema,
  UpdateCartItemSchema,
} from "./cart.dto.ts";

// Cookie name for guest cart ID
const GUEST_CART_COOKIE = "guest_cart_id";
const GUEST_CART_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

/**
 * Cart Controller
 *
 * Handles HTTP requests for cart operations.
 * Supports both authenticated users and guest users via guestId cookie.
 */
export class CartController {
  /**
   * Extract user ID from JWT or guest ID from cookie
   */
  private getCartIdentifiers(c: Context): {
    userId?: number;
    guestId?: string;
  } {
    // Check for authenticated user
    const user = c.get("user");
    if (user?.id) {
      return { userId: user.id };
    }

    // Check for guest ID in cookie
    const guestId = c.req.header("x-guest-id") ||
      getCookie(c, GUEST_CART_COOKIE);
    if (guestId) {
      return { guestId };
    }

    // Generate new guest ID
    const newGuestId = crypto.randomUUID();
    return { guestId: newGuestId };
  }

  /**
   * Set guest cart cookie
   */
  private setGuestCookie(c: Context, guestId: string): void {
    setCookie(c, GUEST_CART_COOKIE, guestId, {
      maxAge: GUEST_CART_COOKIE_MAX_AGE,
      httpOnly: true,
      sameSite: "Lax",
      path: "/",
    });
  }

  /**
   * GET /cart - Get or create active cart
   */
  async getCart(c: Context) {
    const { userId, guestId } = this.getCartIdentifiers(c);

    const cart = await cartService.getOrCreateCart(userId, guestId);

    // Set guest cookie if guest user
    if (guestId && !userId) {
      this.setGuestCookie(c, guestId);
    }

    return c.json({
      success: true,
      data: cart,
    });
  }

  /**
   * POST /cart/items - Add item to cart
   */
  async addItem(c: Context) {
    const { userId, guestId } = this.getCartIdentifiers(c);

    // Parse and validate body
    const body = await c.req.json();
    const parseResult = AddCartItemSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestError(
        parseResult.error.errors.map((e: { message: string }) => e.message)
          .join(", "),
      );
    }

    // Get or create cart
    const cart = await cartService.getOrCreateCart(userId, guestId);

    // Add item
    const item = await cartService.addItem(cart.id, parseResult.data);

    // Set guest cookie if guest user
    if (guestId && !userId) {
      this.setGuestCookie(c, guestId);
    }

    return c.json({
      success: true,
      message: "Item added to cart",
      data: item,
    }, 201);
  }

  /**
   * PUT /cart/items/:id - Update item quantity
   */
  async updateItem(c: Context) {
    const { userId, guestId } = this.getCartIdentifiers(c);
    const itemId = c.req.param("id");

    if (!itemId) {
      throw new BadRequestError("Item ID is required");
    }

    // Parse and validate body
    const body = await c.req.json();
    const parseResult = UpdateCartItemSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestError(
        parseResult.error.errors.map((e: { message: string }) => e.message)
          .join(", "),
      );
    }

    // Get cart
    const cart = await cartService.getOrCreateCart(userId, guestId);

    // Update item
    const item = await cartService.updateItemQuantity(
      cart.id,
      itemId,
      parseResult.data.quantity,
    );

    return c.json({
      success: true,
      message: "Item quantity updated",
      data: item,
    });
  }

  /**
   * DELETE /cart/items/:id - Remove item from cart
   */
  async removeItem(c: Context) {
    const { userId, guestId } = this.getCartIdentifiers(c);
    const itemId = c.req.param("id");

    if (!itemId) {
      throw new BadRequestError("Item ID is required");
    }

    // Get cart
    const cart = await cartService.getOrCreateCart(userId, guestId);

    // Remove item
    const removed = await cartService.removeItem(cart.id, itemId);

    if (!removed) {
      throw new NotFoundError("Cart item not found");
    }

    return c.json({
      success: true,
      message: "Item removed from cart",
    });
  }

  /**
   * DELETE /cart - Clear all items from cart
   */
  async clearCart(c: Context) {
    const { userId, guestId } = this.getCartIdentifiers(c);

    // Get cart
    const cart = await cartService.getOrCreateCart(userId, guestId);

    // Clear cart
    await cartService.clearCart(cart.id);

    return c.json({
      success: true,
      message: "Cart cleared",
    });
  }

  /**
   * GET /cart/count - Get cart item count (for header badge)
   */
  async getCartCount(c: Context) {
    const { userId, guestId } = this.getCartIdentifiers(c);

    const count = await cartService.getCartCount(userId, guestId);

    return c.json({
      success: true,
      data: count,
    });
  }

  /**
   * POST /cart/merge - Merge guest cart into user cart (called after login)
   */
  async mergeCarts(c: Context) {
    // This endpoint requires authentication
    const user = c.get("user");
    if (!user?.id) {
      throw new BadRequestError("Authentication required");
    }

    // Parse body for guest ID
    const body = await c.req.json();
    const parseResult = MergeCartsSchema.safeParse(body);
    if (!parseResult.success) {
      throw new BadRequestError(
        parseResult.error.errors.map((e: { message: string }) => e.message)
          .join(", "),
      );
    }

    // Merge carts
    const mergedCart = await cartService.mergeCarts(
      parseResult.data.guestId,
      user.id,
    );

    // Clear guest cookie
    deleteCookie(c, GUEST_CART_COOKIE);

    return c.json({
      success: true,
      message: "Carts merged successfully",
      data: mergedCart,
    });
  }

  /**
   * GET /cart/validate - Validate stock for checkout
   */
  async validateStock(c: Context) {
    const { userId, guestId } = this.getCartIdentifiers(c);

    // Get cart
    const cart = await cartService.getOrCreateCart(userId, guestId);

    // Validate stock
    const validation = await cartService.validateStock(cart.id);

    return c.json({
      success: true,
      data: validation,
    });
  }
}

// Cookie helper functions (Hono's cookie utilities)
function getCookie(c: Context, name: string): string | undefined {
  const cookies = c.req.header("cookie");
  if (!cookies) return undefined;

  const match = cookies.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(
  c: Context,
  name: string,
  value: string,
  options: {
    maxAge?: number;
    httpOnly?: boolean;
    sameSite?: "Strict" | "Lax" | "None";
    path?: string;
    secure?: boolean;
  } = {},
): void {
  let cookie = `${name}=${encodeURIComponent(value)}`;

  if (options.maxAge !== undefined) {
    cookie += `; Max-Age=${options.maxAge}`;
  }
  if (options.httpOnly) {
    cookie += "; HttpOnly";
  }
  if (options.sameSite) {
    cookie += `; SameSite=${options.sameSite}`;
  }
  if (options.path) {
    cookie += `; Path=${options.path}`;
  }
  if (options.secure) {
    cookie += "; Secure";
  }

  c.header("Set-Cookie", cookie, { append: true });
}

function deleteCookie(c: Context, name: string): void {
  setCookie(c, name, "", { maxAge: 0, path: "/" });
}

// Singleton instance
export const cartController = new CartController();
