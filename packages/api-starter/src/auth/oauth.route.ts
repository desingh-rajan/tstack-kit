/**
 * OAuth Routes
 *
 * Routes for OAuth authentication (Google, GitHub, etc.)
 */

import { Hono } from "hono";
import { OAuthController } from "./oauth.controller.ts";
import { requireAuth } from "../shared/middleware/requireAuth.ts";

const oauthRoutes = new Hono();

// Google OAuth routes
oauthRoutes.get("/auth/google", OAuthController.googleAuth);
oauthRoutes.get("/auth/google/callback", OAuthController.googleCallback);
oauthRoutes.post("/auth/google/token", OAuthController.googleToken);
oauthRoutes.get("/auth/google/state", OAuthController.getGoogleState);

// Account linking (requires authentication)
oauthRoutes.post("/auth/oauth/link", requireAuth, OAuthController.linkAccount);
oauthRoutes.delete(
  "/auth/oauth/unlink/:provider",
  requireAuth,
  OAuthController.unlinkAccount,
);

export default oauthRoutes;
