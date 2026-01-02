/**
 * OAuth Providers Module
 *
 * Central export for all OAuth provider implementations.
 *
 * Architecture:
 * - IOAuthProvider: Interface all providers must implement
 * - BaseOAuthProvider: Abstract class with common utilities
 * - createOAuthProvider(): Factory for provider selection
 * - getAvailableOAuthProviders(): List configured providers
 *
 * @example
 * ```typescript
 * import { createOAuthProvider, getAvailableOAuthProviders } from "@/shared/providers/auth";
 *
 * // Get specific provider
 * const google = createOAuthProvider("google");
 *
 * // Get all available
 * const providers = getAvailableOAuthProviders();
 * ```
 */

// Provider interface and base class
export {
  BaseOAuthProvider,
  type IOAuthProvider,
  type OAuthCallbackResult,
  type OAuthProviderConfig,
  type OAuthTokens,
  type OAuthUserProfile,
} from "./auth-provider.interface.ts";

// Google Provider
export {
  createGoogleProviderFromEnv,
  type GoogleAuthConfig,
  GoogleAuthProvider,
} from "./google.provider.ts";

// Factory and utilities
export {
  createOAuthProvider,
  getAllOAuthProviders,
  getAvailableOAuthProviders,
  isOAuthProviderAvailable,
  type OAuthProviderType,
} from "./factory.ts";

// Future providers (uncomment as implemented):
// export { GitHubAuthProvider, createGitHubProviderFromEnv } from "./github.provider.ts";
// export { AppleAuthProvider, createAppleProviderFromEnv } from "./apple.provider.ts";
