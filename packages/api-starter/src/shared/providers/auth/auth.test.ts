/**
 * OAuth Provider Tests
 *
 * Tests for the OAuth provider abstraction.
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BaseOAuthProvider, GoogleAuthProvider } from "./google.provider.ts";
import {
  createOAuthProvider,
  getAvailableOAuthProviders,
  isOAuthProviderAvailable,
} from "./factory.ts";

describe("OAuth Provider", () => {
  describe("BaseOAuthProvider", () => {
    it("should generate a random state", () => {
      const state1 = BaseOAuthProvider.generateState();
      const state2 = BaseOAuthProvider.generateState();

      assertExists(state1);
      assertExists(state2);
      assertEquals(state1.length, 64); // 32 bytes = 64 hex chars
      assertEquals(state2.length, 64);
      // States should be unique
      assertEquals(state1 !== state2, true);
    });
  });

  describe("GoogleAuthProvider", () => {
    const config = {
      clientId: "test-client-id.apps.googleusercontent.com",
      clientSecret: "test-client-secret",
      callbackUrl: "http://localhost:8000/auth/google/callback",
    };

    it("should create provider with config", () => {
      const provider = new GoogleAuthProvider(config);
      assertEquals(provider.name, "google");
    });

    it("should generate authorization URL with required params", () => {
      const provider = new GoogleAuthProvider(config);
      const state = "test-state-123";
      const url = provider.getAuthorizationUrl(state);

      assertEquals(url.includes("accounts.google.com/o/oauth2/v2/auth"), true);
      assertEquals(url.includes(`client_id=${config.clientId}`), true);
      assertEquals(
        url.includes(`redirect_uri=${encodeURIComponent(config.callbackUrl)}`),
        true,
      );
      assertEquals(url.includes("response_type=code"), true);
      assertEquals(url.includes(`state=${state}`), true);
      assertEquals(url.includes("scope="), true);
      assertEquals(url.includes("access_type=offline"), true);
    });

    it("should include default scopes", () => {
      const provider = new GoogleAuthProvider(config);
      const url = provider.getAuthorizationUrl("test-state");

      assertEquals(url.includes("openid"), true);
      assertEquals(url.includes("email"), true);
      assertEquals(url.includes("profile"), true);
    });

    it("should allow custom scopes", () => {
      const provider = new GoogleAuthProvider({
        ...config,
        scopes: [
          "email",
          "profile",
          "https://www.googleapis.com/auth/calendar",
        ],
      });
      const url = provider.getAuthorizationUrl("test-state");

      assertEquals(url.includes("calendar"), true);
    });

    it("should allow custom access type", () => {
      const provider = new GoogleAuthProvider({
        ...config,
        accessType: "online",
      });
      const url = provider.getAuthorizationUrl("test-state");

      assertEquals(url.includes("access_type=online"), true);
    });

    it("should allow custom prompt", () => {
      const provider = new GoogleAuthProvider({
        ...config,
        prompt: "select_account",
      });
      const url = provider.getAuthorizationUrl("test-state");

      assertEquals(url.includes("prompt=select_account"), true);
    });
  });

  describe("OAuth Provider Factory", () => {
    it("should return null for unconfigured provider", () => {
      // GitHub is not yet implemented
      const provider = createOAuthProvider("github");
      assertEquals(provider, null);
    });

    it("should return null for unknown provider", () => {
      // @ts-ignore - testing invalid input
      const provider = createOAuthProvider("unknown");
      assertEquals(provider, null);
    });

    it("should return list of available providers", () => {
      const available = getAvailableOAuthProviders();
      assertExists(available);
      assertEquals(Array.isArray(available), true);
      // List should only contain configured providers
    });

    it("should check if provider is available", () => {
      // GitHub is not implemented yet
      const githubAvailable = isOAuthProviderAvailable("github");
      assertEquals(githubAvailable, false);

      // Google availability depends on env vars
      const googleAvailable = isOAuthProviderAvailable("google");
      assertEquals(typeof googleAvailable, "boolean");
    });

    it("should create Google provider if configured", () => {
      // This test depends on whether GOOGLE_* env vars are set
      const provider = createOAuthProvider("google");

      if (
        Deno.env.get("GOOGLE_CLIENT_ID") &&
        Deno.env.get("GOOGLE_CLIENT_SECRET") &&
        Deno.env.get("GOOGLE_REDIRECT_URI")
      ) {
        assertExists(provider);
        assertEquals(provider?.name, "google");
      } else {
        assertEquals(provider, null);
      }
    });
  });
});
