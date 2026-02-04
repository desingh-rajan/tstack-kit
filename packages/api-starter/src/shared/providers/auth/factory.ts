/**
 * OAuth Provider Factory
 *
 * Creates OAuth providers based on configuration.
 * Supports auto-detection of available providers from environment variables.
 *
 * Environment Variables:
 * - GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI: Google OAuth
 * - FACEBOOK_APP_ID, FACEBOOK_APP_SECRET: Facebook OAuth
 * - GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET: GitHub OAuth (future)
 *
 * Usage:
 * ```typescript
 * // Get specific provider
 * const google = createOAuthProvider("google");
 *
 * // Get all available providers
 * const available = getAvailableOAuthProviders();
 * ```
 */

import type { IOAuthProvider } from "./auth-provider.interface.ts";
import { createGoogleProviderFromEnv } from "./google.provider.ts";
import { createFacebookProviderFromEnv } from "./facebook.provider.ts";

/**
 * Supported OAuth provider types
 */
export type OAuthProviderType = "google" | "facebook" | "github" | "apple";

/**
 * Create an OAuth provider instance
 * @param provider Provider type to create
 * @returns Provider instance or null if not configured
 */
export function createOAuthProvider(
  provider: OAuthProviderType,
): IOAuthProvider | null {
  switch (provider) {
    case "google": {
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
      const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");

      if (clientId && clientSecret && redirectUri) {
        return createGoogleProviderFromEnv();
      }
      console.warn(
        "[OAuthFactory] Google OAuth not configured - missing credentials",
      );
      return null;
    }

    case "facebook": {
      const appId = Deno.env.get("FACEBOOK_APP_ID");
      const appSecret = Deno.env.get("FACEBOOK_APP_SECRET");

      if (appId && appSecret) {
        return createFacebookProviderFromEnv();
      }
      console.warn(
        "[OAuthFactory] Facebook OAuth not configured - missing credentials",
      );
      return null;
    }

    case "github": {
      // Future implementation
      // const clientId = Deno.env.get("GITHUB_CLIENT_ID");
      // const clientSecret = Deno.env.get("GITHUB_CLIENT_SECRET");
      // if (clientId && clientSecret) {
      //   return new GitHubAuthProvider({ clientId, clientSecret, callbackUrl });
      // }
      console.warn("[OAuthFactory] GitHub OAuth not yet implemented");
      return null;
    }

    case "apple": {
      // Future implementation
      console.warn("[OAuthFactory] Apple OAuth not yet implemented");
      return null;
    }

    default:
      console.warn(`[OAuthFactory] Unknown provider: ${provider}`);
      return null;
  }
}

/**
 * Get list of available OAuth providers based on configured credentials
 * @returns Array of available provider names
 */
export function getAvailableOAuthProviders(): OAuthProviderType[] {
  const available: OAuthProviderType[] = [];

  // Check Google
  if (
    Deno.env.get("GOOGLE_CLIENT_ID") &&
    Deno.env.get("GOOGLE_CLIENT_SECRET") &&
    Deno.env.get("GOOGLE_REDIRECT_URI")
  ) {
    available.push("google");
  }

  // Check Facebook
  if (
    Deno.env.get("FACEBOOK_APP_ID") &&
    Deno.env.get("FACEBOOK_APP_SECRET")
  ) {
    available.push("facebook");
  }

  // Future: Check GitHub
  // if (Deno.env.get("GITHUB_CLIENT_ID") && Deno.env.get("GITHUB_CLIENT_SECRET")) {
  //   available.push("github");
  // }

  // Future: Check Apple
  // if (Deno.env.get("APPLE_CLIENT_ID") && Deno.env.get("APPLE_TEAM_ID")) {
  //   available.push("apple");
  // }

  return available;
}

/**
 * Check if a specific OAuth provider is available
 * @param provider Provider type to check
 * @returns True if the provider is configured and available
 */
export function isOAuthProviderAvailable(provider: OAuthProviderType): boolean {
  return getAvailableOAuthProviders().includes(provider);
}

/**
 * Get all configured OAuth providers as a map
 * @returns Map of provider name to provider instance
 */
export function getAllOAuthProviders(): Map<OAuthProviderType, IOAuthProvider> {
  const providers = new Map<OAuthProviderType, IOAuthProvider>();
  const available = getAvailableOAuthProviders();

  for (const providerType of available) {
    const provider = createOAuthProvider(providerType);
    if (provider) {
      providers.set(providerType, provider);
    }
  }

  return providers;
}
