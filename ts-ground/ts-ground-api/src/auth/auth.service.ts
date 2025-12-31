import { and, eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { type SafeUser, users } from "./user.model.ts";
import { authTokens } from "./auth-token.model.ts";
import { hashPassword, verifyPassword } from "../shared/utils/password.ts";
import { createToken } from "../shared/utils/jwt.ts";
import { BadRequestError, UnauthorizedError } from "../shared/utils/errors.ts";
import {
  createSmtpProviderFromEnv,
  EmailService,
} from "../shared/providers/email/index.ts";

/**
 * Generate a secure random token
 */
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

/**
 * Get email service instance (lazy initialization)
 */
let emailServiceInstance: EmailService | null = null;
function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    const provider = createSmtpProviderFromEnv();
    emailServiceInstance = new EmailService(provider, {
      appName: Deno.env.get("APP_NAME") || "TStack App",
      appUrl: Deno.env.get("APP_URL") || "http://localhost:8000",
      supportEmail: Deno.env.get("SUPPORT_EMAIL"),
    });
  }
  return emailServiceInstance;
}

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

export class AuthService {
  /**
   * Register a new user
   */
  static async register(data: {
    email: string;
    password: string;
    username?: string;
    phone?: string;
  }): Promise<{ user: SafeUser; token: string }> {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new BadRequestError("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user (always with "user" role - cannot register as admin)
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        username: data.username,
        phone: data.phone,
        password: hashedPassword,
        role: "user", // Default role, cannot be changed via signup
      })
      .returning();

    // Create token
    const token = await createToken({
      userId: newUser.id,
      email: newUser.email,
    });

    // Store token in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await db.insert(authTokens).values({
      userId: newUser.id,
      token,
      expiresAt,
    });

    // Send verification email (non-blocking)
    AuthService.sendVerificationEmail(newUser.id).catch((err) => {
      console.error("[AuthService] Failed to send verification email:", err);
    });

    return { user: toSafeUser(newUser), token };
  }

  /**
   * Login user
   */
  static async login(data: {
    email: string;
    password: string;
  }): Promise<{ user: SafeUser; token: string }> {
    // Find user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError("Account is disabled");
    }

    // Verify password
    const isValidPassword = await verifyPassword(data.password, user.password);
    if (!isValidPassword) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Create token
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

    return { user: toSafeUser(user), token };
  }

  /**
   * Logout user (revoke token)
   */
  static async logout(token: string): Promise<void> {
    await db
      .delete(authTokens)
      .where(eq(authTokens.token, token));
  }

  /**
   * Validate token and return user
   */
  static async validateToken(token: string): Promise<SafeUser | null> {
    // Check if token exists and is not revoked
    const [tokenRecord] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.token, token),
          eq(authTokens.isRevoked, false),
        ),
      )
      .limit(1);

    if (!tokenRecord) {
      return null;
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      return null;
    }

    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, tokenRecord.userId))
      .limit(1);

    if (!user || !user.isActive) {
      return null;
    }

    return toSafeUser(user);
  }

  /**
   * Get current user info
   */
  static async getCurrentUser(userId: number): Promise<SafeUser> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    return toSafeUser(user);
  }

  /**
   * Change password
   */
  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Verify current password
    const isValidPassword = await verifyPassword(
      currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      throw new BadRequestError("Current password is incorrect");
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));

    // Delete all existing tokens for security (force re-login)
    await db
      .delete(authTokens)
      .where(eq(authTokens.userId, userId));
  }

  // ============================================
  // Email Verification Methods
  // ============================================

  /**
   * Send verification email to user
   */
  static async sendVerificationEmail(userId: number): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new BadRequestError("User not found");
    }

    if (user.isEmailVerified) {
      throw new BadRequestError("Email is already verified");
    }

    // Generate verification token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    // Store token in database
    await db
      .update(users)
      .set({
        emailVerificationToken: token,
        emailVerificationExpiry: expiresAt,
      })
      .where(eq(users.id, userId));

    // Build verification URL
    const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
    const verificationUrl = `${appUrl}/auth/verify-email?token=${token}`;

    // Send email
    const emailService = getEmailService();
    const result = await emailService.sendVerificationEmail(
      user.email,
      user.username || user.firstName || "User",
      verificationUrl,
      24,
    );

    if (!result.success) {
      console.error(
        "[AuthService] Failed to send verification email:",
        result.error,
      );
      throw new BadRequestError(
        "Failed to send verification email. Please try again.",
      );
    }
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<SafeUser> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    if (!user) {
      throw new BadRequestError("Invalid verification token");
    }

    if (user.isEmailVerified) {
      throw new BadRequestError("Email is already verified");
    }

    if (
      !user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()
    ) {
      throw new BadRequestError(
        "Verification token has expired. Please request a new one.",
      );
    }

    // Mark email as verified and clear token
    const [updatedUser] = await db
      .update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      })
      .where(eq(users.id, user.id))
      .returning();

    // Send welcome email (non-blocking)
    const emailService = getEmailService();
    emailService
      .sendWelcomeEmail(
        updatedUser.email,
        updatedUser.username || updatedUser.firstName || "User",
      )
      .catch((err) => {
        console.error("[AuthService] Failed to send welcome email:", err);
      });

    return toSafeUser(updatedUser);
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email: string): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Don't reveal if user exists or not
      return;
    }

    if (user.isEmailVerified) {
      // Don't reveal verification status
      return;
    }

    await AuthService.sendVerificationEmail(user.id);
  }

  // ============================================
  // Password Reset Methods
  // ============================================

  /**
   * Request password reset (forgot password)
   */
  static async forgotPassword(email: string): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      // Don't reveal if user exists - security best practice
      // Still return success to prevent email enumeration
      return;
    }

    if (!user.isActive) {
      return;
    }

    // Generate reset token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    // Store token in database
    await db
      .update(users)
      .set({
        passwordResetToken: token,
        passwordResetExpiry: expiresAt,
      })
      .where(eq(users.id, user.id));

    // Build reset URL
    const appUrl = Deno.env.get("APP_URL") || "http://localhost:8000";
    const resetUrl = `${appUrl}/auth/reset-password?token=${token}`;

    // Send email
    const emailService = getEmailService();
    const result = await emailService.sendPasswordResetEmail(
      user.email,
      user.username || user.firstName || "User",
      resetUrl,
      1,
    );

    if (!result.success) {
      console.error(
        "[AuthService] Failed to send password reset email:",
        result.error,
      );
      // Don't throw - don't reveal if user exists
    }
  }

  /**
   * Reset password with token
   */
  static async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<void> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (!user) {
      throw new BadRequestError("Invalid or expired reset token");
    }

    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestError(
        "Reset token has expired. Please request a new one.",
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and clear reset token
    await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpiry: null,
      })
      .where(eq(users.id, user.id));

    // Revoke all existing tokens for security
    await db
      .delete(authTokens)
      .where(eq(authTokens.userId, user.id));
  }

  /**
   * Validate reset token (check if valid without using it)
   */
  static async validateResetToken(token: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (!user) {
      return false;
    }

    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      return false;
    }

    return true;
  }
}
