/**
 * Facebook OAuth Provider
 *
 * Implementation of IOAuthProvider for Facebook OAuth 2.0
 * Also supports Instagram (uses same Facebook Graph API)
 *
 * @example
 * ```typescript
 * const provider = new FacebookAuthProvider({
 *   clientId: "your-app-id",
 *   clientSecret: "your-app-secret",
 *   callbackUrl: "http://localhost:8000/auth/facebook/callback",
 * });
 *
 * // Step 1: Redirect user to Facebook
 * const state = FacebookAuthProvider.generateState();
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

/**
 * Facebook-specific configuration
 */
export interface FacebookAuthConfig extends OAuthProviderConfig {
  /** Auth type - rerequest to ask again for declined permissions */
  authType?: "rerequest";

  /** Display mode for auth dialog */
  display?: "page" | "popup" | "touch";
}

/**
 * Facebook user info response from Graph API
 */
interface FacebookUserInfo {
  id: string;
  email?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  picture?: {
    data: {
      url: string;
      width: number;
      height: number;
      is_silhouette: boolean;
    };
  };
}

/**
 * Facebook token response
 */
interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

/**
 * Facebook token debug response
 */
interface FacebookTokenDebugResponse {
  data: {
    app_id: string;
    is_valid: boolean;
    user_id: string;
    scopes: string[];
    expires_at: number;
  };
}

const FACEBOOK_AUTH_URL = "https://www.facebook.com/v18.0/dialog/oauth";
const FACEBOOK_TOKEN_URL =
  "https://graph.facebook.com/v18.0/oauth/access_token";
const FACEBOOK_USERINFO_URL = "https://graph.facebook.com/v18.0/me";
const FACEBOOK_DEBUG_TOKEN_URL = "https://graph.facebook.com/debug_token";

const DEFAULT_SCOPES = [
  "email",
  "public_profile",
];

/**
 * Facebook OAuth Provider
 */
export class FacebookAuthProvider extends BaseOAuthProvider {
  readonly name = "facebook";
  private facebookConfig: FacebookAuthConfig;

  constructor(config: FacebookAuthConfig) {
    super(config);
    this.facebookConfig = {
      ...config,
      scopes: config.scopes || DEFAULT_SCOPES,
      display: config.display || "page",
    };
  }

  /**
   * Get Facebook OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const params: Record<string, string> = {
      client_id: this.facebookConfig.clientId,
      redirect_uri: this.facebookConfig.callbackUrl,
      response_type: "code",
      scope: this.facebookConfig.scopes!.join(","),
      state: state,
      display: this.facebookConfig.display!,
    };

    if (this.facebookConfig.authType) {
      params.auth_type = this.facebookConfig.authType;
    }

    return `${FACEBOOK_AUTH_URL}?${this.encodeParams(params)}`;
  }

  /**
   * Handle Facebook OAuth callback
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
      client_id: this.facebookConfig.clientId,
      client_secret: this.facebookConfig.clientSecret,
      code: code,
      redirect_uri: this.facebookConfig.callbackUrl,
    });

    const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);

    if (!response.ok) {
      const error = await response.text();
      console.error("[FacebookAuthProvider] Token exchange failed:", error);
      throw new Error(`Failed to exchange code for tokens: ${response.status}`);
    }

    const data: FacebookTokenResponse = await response.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  /**
   * Get user profile from Facebook Graph API
   */
  private async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const fields = "id,email,name,first_name,last_name,picture.type(large)";
    const url =
      `${FACEBOOK_USERINFO_URL}?fields=${fields}&access_token=${accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      console.error("[FacebookAuthProvider] Failed to get user info:", error);
      throw new Error(`Failed to get user profile: ${response.status}`);
    }

    const data: FacebookUserInfo = await response.json();

    return {
      providerId: data.id,
      provider: "facebook",
      email: data.email || "",
      emailVerified: !!data.email, // Facebook only returns verified emails
      firstName: data.first_name,
      lastName: data.last_name,
      displayName: data.name,
      avatarUrl: data.picture?.data?.url,
      raw: data as unknown as Record<string, unknown>,
    };
  }

  /**
   * Debug/validate a token
   */
  async debugToken(
    inputToken: string,
  ): Promise<FacebookTokenDebugResponse["data"]> {
    const appAccessToken =
      `${this.facebookConfig.clientId}|${this.facebookConfig.clientSecret}`;
    const url =
      `${FACEBOOK_DEBUG_TOKEN_URL}?input_token=${inputToken}&access_token=${appAccessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      console.error("[FacebookAuthProvider] Token debug failed:", error);
      throw new Error(`Failed to debug token: ${response.status}`);
    }

    const data: FacebookTokenDebugResponse = await response.json();
    return data.data;
  }

  /**
   * Exchange short-lived token for long-lived token (60 days)
   */
  async getLongLivedToken(shortLivedToken: string): Promise<OAuthTokens> {
    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: this.facebookConfig.clientId,
      client_secret: this.facebookConfig.clientSecret,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(`${FACEBOOK_TOKEN_URL}?${params.toString()}`);

    if (!response.ok) {
      const error = await response.text();
      console.error(
        "[FacebookAuthProvider] Long-lived token exchange failed:",
        error,
      );
      throw new Error(
        `Failed to get long-lived token: ${response.status}`,
      );
    }

    const data: FacebookTokenResponse = await response.json();

    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }
}

/**
 * Create FacebookAuthProvider from environment variables
 *
 * Required env vars:
 * - FACEBOOK_APP_ID
 * - FACEBOOK_APP_SECRET
 * - FACEBOOK_CALLBACK_URL (or defaults to APP_URL + /auth/facebook/callback)
 */
export function createFacebookProviderFromEnv(): FacebookAuthProvider {
  const clientId = Deno.env.get("FACEBOOK_APP_ID");
  const clientSecret = Deno.env.get("FACEBOOK_APP_SECRET");
  const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
  const callbackUrl = Deno.env.get("FACEBOOK_CALLBACK_URL") ||
    `${appUrl}/auth/facebook/callback`;

  if (!clientId || !clientSecret) {
    throw new Error(
      "Missing required Facebook OAuth environment variables: FACEBOOK_APP_ID, FACEBOOK_APP_SECRET",
    );
  }

  return new FacebookAuthProvider({
    clientId,
    clientSecret,
    callbackUrl,
  });
}
