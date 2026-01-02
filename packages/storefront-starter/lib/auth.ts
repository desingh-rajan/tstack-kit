/**
 * Auth utilities for storefront
 */

import type { FreshContext } from "fresh";

const SESSION_COOKIE = "store_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getSessionToken(ctx: FreshContext): string | undefined {
  const cookies = ctx.req.headers.get("cookie");
  if (!cookies) return undefined;

  const match = cookies.match(new RegExp(`${SESSION_COOKIE}=([^;]+)`));
  return match?.[1];
}

export function setSessionCookie(
  headers: Headers,
  token: string,
  maxAge: number = SESSION_MAX_AGE,
): void {
  headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`,
  );
}

export function clearSessionCookie(headers: Headers): void {
  headers.set(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}

/**
 * Middleware to require authentication
 */
export function requireAuth(ctx: FreshContext, redirectTo?: string) {
  const token = getSessionToken(ctx);
  if (!token) {
    const redirect = redirectTo || ctx.url.pathname;
    return ctx.redirect(`/auth/login?redirect=${encodeURIComponent(redirect)}`);
  }
  return token;
}
