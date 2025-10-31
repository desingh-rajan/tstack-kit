import { Context, Next } from "hono";
import { extractTokenFromHeader, verifyToken } from "../utils/jwt.ts";
import { AuthService } from "../../auth/auth.service.ts";
import { UnauthorizedError } from "../utils/errors.ts";

/**
 * Middleware to require authentication
 * Validates JWT token and attaches user info to context
 */
export async function requireAuth(c: Context, next: Next) {
  try {
    // Extract token from Authorization header
    const authHeader = c.req.header("Authorization");
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedError("No token provided");
    }

    // Verify token signature and expiry
    const payload = await verifyToken(token);

    // Validate token in database (check if revoked)
    const user = await AuthService.validateToken(token);

    if (!user) {
      throw new UnauthorizedError("Invalid or expired token");
    }

    // Attach user info to context
    c.set("userId", payload.userId);
    c.set("userEmail", payload.email);
    c.set("user", user);

    await next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    throw new UnauthorizedError("Authentication failed");
  }
}
