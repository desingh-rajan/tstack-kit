/**
 * Google OAuth Provider
 *
 * Implementation of IOAuthProvider for Google OAuth 2.0
 *
 * @example
 * ```typescript
 * const provider = new GoogleAuthProvider({
 *   clientId: "xxx.apps.googleusercontent.com",
 *   clientSecret: "GOCSPX-xxx",
 *   callbackUrl: "http://localhost:8000/auth/google/callback",
 * });
 *
 * // Step 1: Redirect user to Google
 * const state = GoogleAuthProvider.generateState();
 * const authUrl = provider.getAuthorizationUrl(state);
 * // Store state in session/cookie for verification
 *
 * // Step 2: Handle callback
 * const { profile, tokens } = await provider.handleCallback(code);
 * ```
 */

import {
  BaseOAuthProvider,
  type OAuthCallbackResult,
  type OAuthProviderConfig,
  type OAuthTokens,
  type OAuthUserProfile,
} from "./auth-provider.interface.ts";

// Re-export for testing
export { BaseOAuthProvider };

/**
 * Google-specific configuration
 */
export interface GoogleAuthConfig extends OAuthProviderConfig {
  /** Access type (online or offline for refresh token) */
  accessType?: "online" | "offline";

  /** Prompt user for consent every time */
  prompt?: "none" | "consent" | "select_account";
}

/**
 * Google user info response
 */
interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

/**
 * Google token response
 */
interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
  id_token?: string;
}

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

const DEFAULT_SCOPES = [
  "openid",
  "email",
  "profile",
];

/**
 * Google OAuth Provider
 */
export class GoogleAuthProvider extends BaseOAuthProvider {
  readonly name = "google";
  private googleConfig: GoogleAuthConfig;

  constructor(config: GoogleAuthConfig) {
    super(config);
    this.googleConfig = {
      ...config,
      scopes: config.scopes || DEFAULT_SCOPES,
      accessType: config.accessType || "offline",
      prompt: config.prompt || "consent",
    };
  }

  /**
   * Get Google OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params: Record<string, string> = {
      client_id: this.googleConfig.clientId,
      redirect_uri: this.googleConfig.callbackUrl,
      response_type: "code",
      scope: this.googleConfig.scopes!.join(" "),
      state: state,
      access_type: this.googleConfig.accessType!,
      prompt: this.googleConfig.prompt!,
    };

    return `${GOOGLE_AUTH_URL}?${this.encodeParams(params)}`;
  }

  /**
   * Handle Google OAuth callback
   */
  async handleCallback(code: string): Promise<OAuthCallbackResult> {
    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(code);

    // Get user profile
    const profile = await this.getUserProfile(tokens.accessToken);

    return { profile, tokens };
  }

  /**
   * Exchange authorization code for tokens
   */
  private async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: this.googleConfig.clientId,
      client_secret: this.googleConfig.clientSecret,
      code: code,
      grant_type: "authorization_code",
      redirect_uri: this.googleConfig.callbackUrl,
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[GoogleAuthProvider] Token exchange failed:", error);
      throw new Error(`Failed to exchange code for tokens: ${response.status}`);
    }

    const data: GoogleTokenResponse = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
      idToken: data.id_token,
    };
  }

  /**
   * Get user profile from Google
   */
  private async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const response = await fetch(GOOGLE_USERINFO_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[GoogleAuthProvider] Failed to get user info:", error);
      throw new Error(`Failed to get user profile: ${response.status}`);
    }

    const data: GoogleUserInfo = await response.json();

    return {
      providerId: data.id,
      provider: "google",
      email: data.email,
      emailVerified: data.verified_email,
      firstName: data.given_name,
      lastName: data.family_name,
      displayName: data.name,
      avatarUrl: data.picture,
      raw: data as unknown as Record<string, unknown>,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      client_id: this.googleConfig.clientId,
      client_secret: this.googleConfig.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("[GoogleAuthProvider] Token refresh failed:", error);
      throw new Error(`Failed to refresh token: ${response.status}`);
    }

    const data: GoogleTokenResponse = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
      scope: data.scope,
      idToken: data.id_token,
    };
  }

  /**
   * Revoke a token (logout from Google)
   */
  async revokeToken(token: string): Promise<void> {
    const response = await fetch(`${GOOGLE_REVOKE_URL}?token=${token}`, {
      method: "POST",
    });

    if (!response.ok) {
      console.error(
        "[GoogleAuthProvider] Token revocation failed:",
        response.status,
      );
      // Don't throw - revocation failure shouldn't break logout
    }
  }
}

/**
 * Create GoogleAuthProvider from environment variables
 *
 * Required env vars:
 * - GOOGLE_CLIENT_ID
 * - GOOGLE_CLIENT_SECRET
 * - GOOGLE_CALLBACK_URL (or defaults to APP_URL + /auth/google/callback)
 */
export function createGoogleProviderFromEnv(): GoogleAuthProvider {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
  const callbackUrl = Deno.env.get("GOOGLE_CALLBACK_URL") ||
    `${appUrl}/auth/google/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing required Google OAuth environment variables: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET",
    );
  }

  return new GoogleAuthProvider({
    clientId,
    clientSecret,
    callbackUrl,
  });
}
