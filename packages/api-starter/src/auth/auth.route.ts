import { Hono } from "hono";
import { AuthController } from "./auth.controller.ts";
import { rateLimit } from "../shared/middleware/rateLimit.ts";
import { requireAuth } from "../shared/middleware/requireAuth.ts";

const authRoutes = new Hono();

// Rate limiters for auth endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many attempts, please try again later.",
});

const passwordResetRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests, please try again later.",
});

// Public routes (no authentication required)
authRoutes.post("/auth/register", authRateLimit, AuthController.register);
authRoutes.post("/auth/login", authRateLimit, AuthController.login);
authRoutes.post(
  "/auth/forgot-password",
  passwordResetRateLimit,
  AuthController.forgotPassword,
);
authRoutes.post(
  "/auth/reset-password",
  passwordResetRateLimit,
  AuthController.resetPassword,
);
authRoutes.get("/auth/verify-email", AuthController.verifyEmail);

// Protected routes (authentication required)
authRoutes.post("/auth/logout", requireAuth, AuthController.logout);
authRoutes.get("/auth/me", requireAuth, AuthController.getCurrentUser);
authRoutes.put(
  "/auth/change-password",
  requireAuth,
  AuthController.changePassword,
);
authRoutes.post(
  "/auth/resend-verification",
  requireAuth,
  AuthController.resendVerification,
);

export default authRoutes;
