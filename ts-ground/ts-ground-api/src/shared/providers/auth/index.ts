/**
 * OAuth Providers Module
 *
 * Central export for all OAuth provider implementations.
 *
 * @example
 * ```typescript
 * import { GoogleAuthProvider, createGoogleProviderFromEnv } from "@/shared/providers/auth";
 *
 * const googleProvider = createGoogleProviderFromEnv();
 * const authUrl = googleProvider.getAuthorizationUrl(state);
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

// Future providers (uncomment as implemented):
// export { GitHubAuthProvider, createGitHubProviderFromEnv } from "./github.provider.ts";
// export { AppleAuthProvider, createAppleProviderFromEnv } from "./apple.provider.ts";
