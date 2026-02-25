/**
 * Root middleware - loads user session and cart
 *
 * Creates a per-request API client to prevent auth token leakage
 * between concurrent SSR requests.
 */

import { define } from "@/utils.ts";
import { createApiClient } from "@/lib/api.ts";
import { getGuestId, getSessionToken } from "@/lib/auth.ts";

export const handler = define.middleware(async (ctx) => {
  const token = getSessionToken(ctx);
  const guestId = getGuestId(ctx);

  // Create a per-request API client (prevents auth leaking across SSR requests)
  const api = createApiClient(token || undefined, guestId || undefined);
  ctx.state.api = api;

  if (token) {
    ctx.state.token = token;

    // Load user profile and cart in parallel with error resilience
    const [userResult, cartResult] = await Promise.all([
      api.getProfile().catch((err) => {
        console.error("[middleware] Failed to load profile:", err);
        return null;
      }),
      api.getCart().catch((err) => {
        console.error("[middleware] Failed to load cart:", err);
        return null;
      }),
    ]);

    if (userResult?.success && userResult.data) {
      ctx.state.user = userResult.data;
    } else {
      // Token may be expired/invalid - fall back to guest cart
      api.clearToken();
      ctx.state.token = undefined;
      if (guestId) {
        api.setGuestId(guestId);
        try {
          const guestCart = await api.getCart();
          if (guestCart.success && guestCart.data) {
            ctx.state.cart = guestCart.data;
          }
        } catch {
          // Ignore guest cart errors
        }
      }
      return ctx.next();
    }

    if (cartResult?.success && cartResult.data) {
      ctx.state.cart = cartResult.data;
    }
  } else if (guestId) {
    // No auth token but guest ID exists - load guest cart
    // (guestId already set via createApiClient above)

    try {
      const cartResponse = await api.getCart();
      if (cartResponse.success && cartResponse.data) {
        ctx.state.cart = cartResponse.data;
      }
    } catch {
      // Ignore guest cart errors
    }
  }

  return ctx.next();
});
