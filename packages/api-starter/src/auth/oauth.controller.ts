/**
 * OAuth Controller
 *
 * Handles OAuth authentication routes.
 */

import { Context } from "hono";
import { OAuthService } from "./oauth.service.ts";
import { ApiResponse } from "../shared/utils/response.ts";
import { BadRequestError } from "../shared/utils/errors.ts";

export class OAuthController {
  /**
   * GET /auth/google
   * Redirect to Google OAuth consent screen
   */
  static googleAuth(c: Context) {
    // Get optional redirect URL from query params
    const redirectUrl = c.req.query("redirect") || c.req.query("redirect_url");

    try {
      const authUrl = OAuthService.getGoogleAuthUrl(redirectUrl);
      return c.redirect(authUrl);
    } catch (error) {
      // If Google OAuth not configured, return error
      const message = error instanceof Error
        ? error.message
        : "Google OAuth not configured";
      return c.json(ApiResponse.error(message), 500);
    }
  }

  /**
   * GET /auth/google/callback
   * Handle Google OAuth callback
   */
  static async googleCallback(c: Context) {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");

    // Handle OAuth errors from Google
    if (error) {
      const errorDescription = c.req.query("error_description") || error;
      console.error("[OAuthController] Google OAuth error:", errorDescription);

      // Redirect to frontend error page
      const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
      return c.redirect(
        `${appUrl}/auth/error?message=${encodeURIComponent(errorDescription)}`,
      );
    }

    if (!code || !state) {
      const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
      return c.redirect(
        `${appUrl}/auth/error?message=${
          encodeURIComponent("Missing authorization code or state")
        }`,
      );
    }

    try {
      const { user: _user, token, isNewUser, redirectUrl } = await OAuthService
        .handleGoogleCallback(code, state);

      // Determine redirect destination
      const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
      const storefrontUrl = Deno.env.get("STOREFRONT_URL") || appUrl;

      // Build redirect URL with token
      let finalRedirectUrl = redirectUrl || storefrontUrl;
      const separator = finalRedirectUrl.includes("?") ? "&" : "?";
      finalRedirectUrl = `${finalRedirectUrl}${separator}token=${token}${
        isNewUser ? "&new_user=true" : ""
      }`;

      return c.redirect(finalRedirectUrl);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "OAuth authentication failed";
      console.error("[OAuthController] Google callback error:", message);

      const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
      return c.redirect(
        `${appUrl}/auth/error?message=${encodeURIComponent(message)}`,
      );
    }
  }

  /**
   * POST /auth/google/token
   * Exchange Google OAuth code for token (for mobile/SPA apps)
   * This is an alternative to the redirect flow
   */
  static async googleToken(c: Context) {
    const body = await c.req.json();
    const { code, state } = body;

    if (!code || !state) {
      throw new BadRequestError("Missing authorization code or state");
    }

    const { user, token, isNewUser } = await OAuthService.handleGoogleCallback(
      code,
      state,
    );

    return c.json(
      ApiResponse.success(
        { user, token, isNewUser },
        isNewUser ? "Account created successfully" : "Login successful",
      ),
      200,
    );
  }

  /**
   * GET /auth/google/state
   * Get a new OAuth state (for SPA apps that need to manage the flow)
   */
  static getGoogleState(c: Context) {
    const redirectUrl = c.req.query("redirect") || c.req.query("redirect_url");

    try {
      const provider = OAuthService.getGoogleAuthUrl(redirectUrl);

      // Extract state from URL
      const url = new URL(provider);
      const state = url.searchParams.get("state");

      return c.json(
        ApiResponse.success(
          { authUrl: provider, state },
          "OAuth state generated",
        ),
        200,
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Google OAuth not configured";
      return c.json(ApiResponse.error(message), 500);
    }
  }

  /**
   * GET /auth/facebook
   * Redirect to Facebook OAuth consent screen
   */
  static facebookAuth(c: Context) {
    const redirectUrl = c.req.query("redirect") || c.req.query("redirect_url");

    try {
      const authUrl = OAuthService.getFacebookAuthUrl(redirectUrl);
      return c.redirect(authUrl);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Facebook OAuth not configured";
      return c.json(ApiResponse.error(message), 500);
    }
  }

  /**
   * GET /auth/facebook/callback
   * Handle Facebook OAuth callback
   */
  static async facebookCallback(c: Context) {
    const code = c.req.query("code");
    const state = c.req.query("state");
    const error = c.req.query("error");

    // Handle OAuth errors from Facebook
    if (error) {
      const errorDescription = c.req.query("error_description") || error;
      console.error(
        "[OAuthController] Facebook OAuth error:",
        errorDescription,
      );

      const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
      return c.redirect(
        `${appUrl}/auth/error?message=${encodeURIComponent(errorDescription)}`,
      );
    }

    if (!code || !state) {
      const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
      return c.redirect(
        `${appUrl}/auth/error?message=${
          encodeURIComponent("Missing authorization code or state")
        }`,
      );
    }

    try {
      const { user: _user, token, isNewUser, redirectUrl } = await OAuthService
        .handleFacebookCallback(code, state);

      const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
      const storefrontUrl = Deno.env.get("STOREFRONT_URL") || appUrl;

      let finalRedirectUrl = redirectUrl || storefrontUrl;
      const separator = finalRedirectUrl.includes("?") ? "&" : "?";
      finalRedirectUrl = `${finalRedirectUrl}${separator}token=${token}${
        isNewUser ? "&new_user=true" : ""
      }`;

      return c.redirect(finalRedirectUrl);
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "OAuth authentication failed";
      console.error("[OAuthController] Facebook callback error:", message);

      const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
      return c.redirect(
        `${appUrl}/auth/error?message=${encodeURIComponent(message)}`,
      );
    }
  }

  /**
   * POST /auth/facebook/token
   * Exchange Facebook OAuth code for token (for mobile/SPA apps)
   */
  static async facebookToken(c: Context) {
    const body = await c.req.json();
    const { code, state } = body;

    if (!code || !state) {
      throw new BadRequestError("Missing authorization code or state");
    }

    const { user, token, isNewUser } = await OAuthService
      .handleFacebookCallback(code, state);

    return c.json(
      ApiResponse.success(
        { user, token, isNewUser },
        isNewUser ? "Account created successfully" : "Login successful",
      ),
      200,
    );
  }

  /**
   * GET /auth/facebook/state
   * Get a new OAuth state (for SPA apps that need to manage the flow)
   */
  static getFacebookState(c: Context) {
    const redirectUrl = c.req.query("redirect") || c.req.query("redirect_url");

    try {
      const authUrl = OAuthService.getFacebookAuthUrl(redirectUrl);

      const url = new URL(authUrl);
      const state = url.searchParams.get("state");

      return c.json(
        ApiResponse.success(
          { authUrl, state },
          "OAuth state generated",
        ),
        200,
      );
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "Facebook OAuth not configured";
      return c.json(ApiResponse.error(message), 500);
    }
  }

  /**
   * POST /auth/oauth/link
   * Link OAuth account to currently logged-in user
   */
  static async linkAccount(c: Context) {
    const userId = c.get("userId") as number;
    const body = await c.req.json();
    const { provider, code } = body;

    if (!provider || !code) {
      throw new BadRequestError("Missing provider or authorization code");
    }

    const user = await OAuthService.linkAccountToUser(userId, provider, code);

    return c.json(
      ApiResponse.success(user, `${provider} account linked successfully`),
      200,
    );
  }

  /**
   * DELETE /auth/oauth/unlink/:provider
   * Unlink OAuth account from user
   */
  static async unlinkAccount(c: Context) {
    const userId = c.get("userId") as number;
    const provider = c.req.param("provider");

    if (!provider) {
      throw new BadRequestError("Missing provider");
    }

    const user = await OAuthService.unlinkAccount(userId, provider);

    return c.json(
      ApiResponse.success(user, `${provider} account unlinked successfully`),
      200,
    );
  }
}
