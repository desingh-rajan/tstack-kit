import { Hono } from "hono";
import { AuthController } from "./auth.controller.ts";
import { requireAuth } from "../shared/middleware/requireAuth.ts";

const authRoutes = new Hono();

// Public routes (no authentication required)
authRoutes.post("/auth/register", AuthController.register);
authRoutes.post("/auth/login", AuthController.login);

// Email verification (public - token-based)
authRoutes.get("/auth/verify-email", AuthController.verifyEmail);
authRoutes.post("/auth/verify-email", AuthController.verifyEmail);
authRoutes.post(
  "/auth/resend-verification",
  AuthController.resendVerificationEmail,
);

// Password reset (public)
authRoutes.post("/auth/forgot-password", AuthController.forgotPassword);
authRoutes.post("/auth/reset-password", AuthController.resetPassword);
authRoutes.get("/auth/validate-reset-token", AuthController.validateResetToken);
authRoutes.post(
  "/auth/validate-reset-token",
  AuthController.validateResetToken,
);

// Protected routes (authentication required)
authRoutes.post("/auth/logout", requireAuth, AuthController.logout);
authRoutes.get("/auth/me", requireAuth, AuthController.getCurrentUser);
authRoutes.put(
  "/auth/change-password",
  requireAuth,
  AuthController.changePassword,
);
authRoutes.post(
  "/auth/send-verification",
  requireAuth,
  AuthController.sendVerificationEmail,
);

export default authRoutes;
