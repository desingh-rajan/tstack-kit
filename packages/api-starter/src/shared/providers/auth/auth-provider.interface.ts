/**
 * OAuth Provider Interface
 *
 * Abstract interface for OAuth providers (Google, GitHub, Apple, etc.)
 * Allows adding new OAuth providers without changing application code.
 *
 * @example
 * ```typescript
 * const provider = new GoogleAuthProvider(config);
 * const authUrl = provider.getAuthorizationUrl(state);
 * // Redirect user to authUrl
 * // After callback:
 * const profile = await provider.handleCallback(code);
 * ```
 */

/**
 * OAuth user profile returned by providers
 */
export interface OAuthUserProfile {
  /** Provider-specific user ID */
  providerId: string;

  /** Provider name (google, github, etc.) */
  provider: string;

  /** User's email address */
  email: string;

  /** Whether the email is verified by the provider */
  emailVerified: boolean;

  /** User's first name */
  firstName?: string;

  /** User's last name */
  lastName?: string;

  /** User's full display name */
  displayName?: string;

  /** URL to user's avatar/profile picture */
  avatarUrl?: string;

  /** Raw profile data from provider */
  raw?: Record<string, unknown>;
}

/**
 * OAuth tokens returned after authentication
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
  idToken?: string;
}

/**
 * OAuth callback result
 */
export interface OAuthCallbackResult {
  profile: OAuthUserProfile;
  tokens: OAuthTokens;
}

/**
 * Base OAuth provider configuration
 */
export interface OAuthProviderConfig {
  /** OAuth client ID */
  clientId: string;

  /** OAuth client secret */
  clientSecret: string;

  /** Callback URL for OAuth redirect */
  callbackUrl: string;

  /** OAuth scopes to request */
  scopes?: string[];
}

/**
 * OAuth Provider Interface
 *
 * All OAuth providers must implement this interface.
 */
export interface IOAuthProvider {
  /**
   * Provider name for identification
   */
  readonly name: string;

  /**
   * Get the authorization URL to redirect the user to
   *
   * @param state - CSRF protection state parameter
   * @returns Authorization URL
   */
  getAuthorizationUrl(state: string): string;

  /**
   * Handle the OAuth callback and exchange code for tokens + profile
   *
   * @param code - Authorization code from callback
   * @returns User profile and tokens
   */
  handleCallback(code: string): Promise<OAuthCallbackResult>;

  /**
   * Refresh an access token using a refresh token
   *
   * @param refreshToken - The refresh token
   * @returns New tokens
   */
  refreshAccessToken?(refreshToken: string): Promise<OAuthTokens>;

  /**
   * Revoke a token (logout from provider)
   *
   * @param token - The token to revoke
   */
  revokeToken?(token: string): Promise<void>;
}

/**
 * Base class for OAuth providers with common functionality
 */
export abstract class BaseOAuthProvider implements IOAuthProvider {
  abstract readonly name: string;
  protected config: OAuthProviderConfig;

  constructor(config: OAuthProviderConfig) {
    this.config = config;
  }

  abstract getAuthorizationUrl(state: string): string;
  abstract handleCallback(code: string): Promise<OAuthCallbackResult>;

  /**
   * Generate a random state parameter for CSRF protection
   */
  static generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
      "",
    );
  }

  /**
   * URL encode parameters for query string
   */
  protected encodeParams(params: Record<string, string>): string {
    return Object.entries(params)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      )
      .join("&");
  }
}
