/**
 * Response type negotiation
 *
 * Detects whether to return HTML, JSON, or htmx partial based on request headers.
 */

import type { Context } from "hono";
import type { ResponseType } from "../core/types.ts";

/**
 * Detect response type from request headers
 *
 * Priority:
 * 1. htmx request (HX-Request header exists) → "htmx"
 * 2. HTML request (Accept header contains text/html) → "html"
 * 3. Default → "json"
 *
 * @param c - Hono context
 * @returns Response type
 *
 * @example
 * ```typescript
 * const type = detectResponseType(c);
 * if (type === "html") {
 *   return c.html(fullPage);
 * } else if (type === "htmx") {
 *   return c.html(partial);
 * } else {
 *   return c.json(data);
 * }
 * ```
 */
export function detectResponseType(c: Context): ResponseType {
  // Check for htmx request
  const hxRequest = c.req.header("HX-Request");
  if (hxRequest === "true") {
    return "htmx";
  }

  // Check for HTML accept header
  const accept = c.req.header("Accept") || "";
  if (accept.includes("text/html")) {
    return "html";
  }

  // Default to JSON
  return "json";
}
