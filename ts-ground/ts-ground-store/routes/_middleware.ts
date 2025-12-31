/**
 * Root middleware - loads user session and cart
 */

import { define } from "@/utils.ts";
import { api } from "@/lib/api.ts";
import { getSessionToken } from "@/lib/auth.ts";

export const handler = define.middleware(async (ctx) => {
  const token = getSessionToken(ctx);

  if (token) {
    api.setToken(token);
    ctx.state.token = token;

    // Try to load user profile
    try {
      const userResponse = await api.getProfile();
      if (userResponse.success && userResponse.data) {
        ctx.state.user = userResponse.data;
      }
    } catch {
      // Token might be invalid, clear it
    }

    // Try to load cart
    try {
      const cartResponse = await api.getCart();
      if (cartResponse.success && cartResponse.data) {
        ctx.state.cart = cartResponse.data;
      }
    } catch {
      // Ignore cart errors
    }
  }

  return ctx.next();
});
