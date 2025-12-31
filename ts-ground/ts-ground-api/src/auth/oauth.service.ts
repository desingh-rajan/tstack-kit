/**
 * OAuth Service
 *
 * Handles OAuth authentication flows and user account linking.
 */

import { eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { type SafeUser, users } from "./user.model.ts";
import { authTokens } from "./auth-token.model.ts";
import { createToken } from "../shared/utils/jwt.ts";
import { BadRequestError } from "../shared/utils/errors.ts";
import {
  createGoogleProviderFromEnv,
  GoogleAuthProvider,
  type OAuthUserProfile,
} from "../shared/providers/auth/index.ts";
import {
  createSmtpProviderFromEnv,
  EmailService,
} from "../shared/providers/email/index.ts";

/**
 * Strip sensitive fields from user object
 */
function toSafeUser(user: typeof users.$inferSelect): SafeUser {
  const {
    password: _,
    emailVerificationToken: __,
    passwordResetToken: ___,
    ...safeUser
  } = user;
  return safeUser;
}

/**
 * OAuth state storage (in-memory for now, use Redis/KV in production)
 */
const oauthStates = new Map<
  string,
  { createdAt: number; redirectUrl?: string }
>();

// Clean up expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000; // 10 minutes
  for (const [state, data] of oauthStates) {
    if (now - data.createdAt > maxAge) {
      oauthStates.delete(state);
    }
  }
}, 5 * 60 * 1000);

/**
 * Get email service instance (lazy initialization)
 */
let emailServiceInstance: EmailService | null = null;
function getEmailService(): EmailService | null {
  if (!emailServiceInstance) {
    try {
      const provider = createSmtpProviderFromEnv();
      emailServiceInstance = new EmailService(provider, {
        appName: Deno.env.get("APP_NAME") || "TStack App",
        appUrl: Deno.env.get("APP_URL") || "http://localhost:8000",
        supportEmail: Deno.env.get("SUPPORT_EMAIL"),
      });
    } catch {
      // Email not configured - return null
      return null;
    }
  }
  return emailServiceInstance;
}

/**
 * Get Google provider instance (lazy initialization)
 */
let googleProviderInstance: GoogleAuthProvider | null = null;
function getGoogleProvider(): GoogleAuthProvider {
  if (!googleProviderInstance) {
    googleProviderInstance = createGoogleProviderFromEnv();
  }
  return googleProviderInstance;
}

export class OAuthService {
  /**
   * Generate OAuth state and store it
   */
  static generateState(redirectUrl?: string): string {
    const state = GoogleAuthProvider.generateState();
    oauthStates.set(state, { createdAt: Date.now(), redirectUrl });
    return state;
  }

  /**
   * Validate OAuth state
   */
  static validateState(
    state: string,
  ): { valid: boolean; redirectUrl?: string } {
    const data = oauthStates.get(state);
    if (!data) {
      return { valid: false };
    }

    // Check if expired (10 minutes)
    const maxAge = 10 * 60 * 1000;
    if (Date.now() - data.createdAt > maxAge) {
      oauthStates.delete(state);
      return { valid: false };
    }

    // Remove state after validation (one-time use)
    oauthStates.delete(state);
    return { valid: true, redirectUrl: data.redirectUrl };
  }

  /**
   * Get Google OAuth authorization URL
   */
  static getGoogleAuthUrl(redirectUrl?: string): string {
    const provider = getGoogleProvider();
    const state = OAuthService.generateState(redirectUrl);
    return provider.getAuthorizationUrl(state);
  }

  /**
   * Handle Google OAuth callback
   */
  static async handleGoogleCallback(
    code: string,
    state: string,
  ): Promise<
    { user: SafeUser; token: string; isNewUser: boolean; redirectUrl?: string }
  > {
    // Validate state
    const stateValidation = OAuthService.validateState(state);
    if (!stateValidation.valid) {
      throw new BadRequestError("Invalid or expired OAuth state");
    }

    // Exchange code for profile
    const provider = getGoogleProvider();
    const { profile } = await provider.handleCallback(code);

    // Find or create user
    const result = await OAuthService.findOrCreateUser(profile);

    return {
      ...result,
      redirectUrl: stateValidation.redirectUrl,
    };
  }

  /**
   * Find existing user or create new one from OAuth profile
   */
  static async findOrCreateUser(
    profile: OAuthUserProfile,
  ): Promise<{ user: SafeUser; token: string; isNewUser: boolean }> {
    // First, try to find user by provider ID (e.g., googleId)
    let user = await OAuthService.findUserByProviderId(profile);

    if (user) {
      // User found by provider ID - just login
      const token = await OAuthService.createSessionToken(user);
      return { user: toSafeUser(user), token, isNewUser: false };
    }

    // Try to find user by email
    user = await OAuthService.findUserByEmail(profile.email);

    if (user) {
      // User exists with same email - link OAuth account
      user = await OAuthService.linkOAuthAccount(user.id, profile);
      const token = await OAuthService.createSessionToken(user);
      return { user: toSafeUser(user), token, isNewUser: false };
    }

    // Create new user
    user = await OAuthService.createUserFromOAuth(profile);
    const token = await OAuthService.createSessionToken(user);

    // Send welcome email (non-blocking)
    const emailService = getEmailService();
    if (emailService) {
      emailService
        .sendWelcomeEmail(user.email, user.firstName || user.username || "User")
        .catch((err: Error) => {
          console.error("[OAuthService] Failed to send welcome email:", err);
        });
    }

    return { user: toSafeUser(user), token, isNewUser: true };
  }

  /**
   * Find user by OAuth provider ID
   */
  private static async findUserByProviderId(
    profile: OAuthUserProfile,
  ): Promise<typeof users.$inferSelect | null> {
    if (profile.provider === "google" && profile.providerId) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.googleId, profile.providerId))
        .limit(1);
      return user || null;
    }
    // Add other providers here (github, apple, etc.)
    return null;
  }

  /**
   * Find user by email
   */
  private static async findUserByEmail(
    email: string,
  ): Promise<typeof users.$inferSelect | null> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user || null;
  }

  /**
   * Link OAuth account to existing user
   */
  private static async linkOAuthAccount(
    userId: number,
    profile: OAuthUserProfile,
  ): Promise<typeof users.$inferSelect> {
    const updateData: Partial<typeof users.$inferInsert> = {};

    if (profile.provider === "google") {
      updateData.googleId = profile.providerId;
    }

    // Update avatar if not set
    if (profile.avatarUrl) {
      updateData.avatarUrl = profile.avatarUrl;
    }

    // Update names if not set
    if (profile.firstName) {
      updateData.firstName = profile.firstName;
    }
    if (profile.lastName) {
      updateData.lastName = profile.lastName;
    }

    // Mark email as verified if provider says so
    if (profile.emailVerified) {
      updateData.isEmailVerified = true;
      updateData.emailVerificationToken = null;
      updateData.emailVerificationExpiry = null;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return updatedUser;
  }

  /**
   * Create new user from OAuth profile
   */
  private static async createUserFromOAuth(
    profile: OAuthUserProfile,
  ): Promise<typeof users.$inferSelect> {
    const userData: typeof users.$inferInsert = {
      email: profile.email,
      password: "", // OAuth users don't have password
      role: "user",
      isEmailVerified: profile.emailVerified,
      isActive: true,
      firstName: profile.firstName,
      lastName: profile.lastName,
      username: profile.displayName,
      avatarUrl: profile.avatarUrl,
    };

    // Set provider-specific ID
    if (profile.provider === "google") {
      userData.googleId = profile.providerId;
    }

    const [newUser] = await db.insert(users).values(userData).returning();

    return newUser;
  }

  /**
   * Create session token for user
   */
  private static async createSessionToken(
    user: typeof users.$inferSelect,
  ): Promise<string> {
    const token = await createToken({
      userId: user.id,
      email: user.email,
    });

    // Store token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(authTokens).values({
      userId: user.id,
      token,
      expiresAt,
    });

    // Update last login
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id));

    return token;
  }

  /**
   * Link OAuth account to currently logged-in user
   */
  static async linkAccountToUser(
    userId: number,
    provider: string,
    code: string,
  ): Promise<SafeUser> {
    let profile: OAuthUserProfile;

    if (provider === "google") {
      const googleProvider = getGoogleProvider();
      const result = await googleProvider.handleCallback(code);
      profile = result.profile;
    } else {
      throw new BadRequestError(`Unsupported OAuth provider: ${provider}`);
    }

    // Check if this OAuth account is already linked to another user
    const existingUser = await OAuthService.findUserByProviderId(profile);
    if (existingUser && existingUser.id !== userId) {
      throw new BadRequestError(
        `This ${provider} account is already linked to another user`,
      );
    }

    // Link account
    const user = await OAuthService.linkOAuthAccount(userId, profile);
    return toSafeUser(user);
  }

  /**
   * Unlink OAuth account from user
   */
  static async unlinkAccount(
    userId: number,
    provider: string,
  ): Promise<SafeUser> {
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new BadRequestError("User not found");
    }

    // Check if user has a password (can't unlink if no other login method)
    if (!user.password || user.password === "") {
      throw new BadRequestError(
        "Cannot unlink OAuth account. Please set a password first.",
      );
    }

    const updateData: Partial<typeof users.$inferInsert> = {};

    if (provider === "google") {
      updateData.googleId = null;
    } else {
      throw new BadRequestError(`Unsupported OAuth provider: ${provider}`);
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    return toSafeUser(updatedUser);
  }
}
