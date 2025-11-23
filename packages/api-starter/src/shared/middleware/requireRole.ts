import { Context, Next } from "hono";
import { ForbiddenError } from "../utils/errors.ts";
import type { UserRole } from "../../auth/user.model.ts";

/**
 * Middleware to check if user has required role
 * Must be used after requireAuth middleware
 *
 * Usage:
 * app.post("/admin/users", requireAuth, requireRole(["superadmin"]), AdminController.createAdmin)
 * app.get("/moderator/posts", requireAuth, requireRole(["superadmin", "admin", "moderator"]), ...)
 */
export function requireRole(allowedRoles: UserRole[]) {
  return async (c: Context, next: Next) => {
    const user = c.get("user");

    if (!user) {
      throw new ForbiddenError("Authentication required");
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      throw new ForbiddenError(
        `Access denied. Required role: ${allowedRoles.join(" or ")}`,
      );
    }

    await next();
  };
}

/**
 * Convenience middleware for superadmin-only routes
 */
export const requireSuperadmin = requireRole(["superadmin"]);

/**
 * Convenience middleware for admin and above (superadmin + admin)
 */
export const requireAdmin = requireRole(["superadmin", "admin"]);

/**
 * Convenience middleware for moderator and above (superadmin + admin + moderator)
 */
export const requireModerator = requireRole([
  "superadmin",
  "admin",
  "moderator",
]);
