import { and, eq } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { db } from "../config/database.ts";
import { type SafeUser, users } from "./user.model.ts";
import { authTokens } from "./auth-token.model.ts";
import { hashPassword, verifyPassword } from "../shared/utils/password.ts";
import { createToken } from "../shared/utils/jwt.ts";
import { BadRequestError, UnauthorizedError } from "../shared/utils/errors.ts";
import { notificationService } from "../shared/services/notification.service.ts";

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

    // Generate email verification token
    const verificationToken = this.generateToken();
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hour expiry

    // Create user (always with "user" role - cannot register as admin)
    const [newUser] = await db
      .insert(users)
      .values({
        email: data.email,
        username: data.username,
        phone: data.phone,
        password: hashedPassword,
        role: "user", // Default role, cannot be changed via signup
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
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

    // Send verification email (fire-and-forget)
    const storefrontUrl = Deno.env.get("STOREFRONT_URL") ||
      Deno.env.get("APP_URL") || "http://localhost:3000";
    const verificationUrl =
      `${storefrontUrl}/verify-email?token=${verificationToken}`;
    const userName = newUser.username || newUser.firstName ||
      newUser.email.split("@")[0];
    notificationService.sendVerificationEmail(
      newUser.email,
      userName,
      verificationUrl,
    );

    // Return user without password
    const { password: _, ...safeUser } = newUser;

    return { user: safeUser, token };
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

    // Return user without password
    const { password: _, ...safeUser } = user;

    return { user: safeUser, token };
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

    // Return user without password
    const { password: _, ...safeUser } = user;
    return safeUser;
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

    const { password: _, ...safeUser } = user;
    return safeUser;
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

  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  /**
   * Request password reset - generates token and sends email
   * Always returns success to prevent email enumeration
   */
  static async forgotPassword(email: string): Promise<void> {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    // If user doesn't exist, silently return (prevent enumeration)
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = this.generateToken();
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1); // 1 hour expiry

    // Store token in database
    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpiry: resetExpiry,
      })
      .where(eq(users.id, user.id));

    // Build reset URL
    const storefrontUrl = Deno.env.get("STOREFRONT_URL") ||
      Deno.env.get("APP_URL") || "http://localhost:3000";
    const resetUrl = `${storefrontUrl}/auth/reset-password?token=${resetToken}`;

    // Send email (fire-and-forget)
    const userName = user.username || user.firstName ||
      user.email.split("@")[0];
    notificationService.sendPasswordResetEmail(user.email, userName, resetUrl);
  }

  /**
   * Reset password using token
   */
  static async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<void> {
    // Find user by reset token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (!user) {
      throw new BadRequestError("Invalid or expired reset token");
    }

    // Check if token is expired
    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestError("Reset token has expired");
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

    // Delete all existing auth tokens for security (force re-login)
    await db
      .delete(authTokens)
      .where(eq(authTokens.userId, user.id));
  }

  /**
   * Verify email address using token
   */
  static async verifyEmail(token: string): Promise<SafeUser> {
    // Find user by verification token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    if (!user) {
      throw new BadRequestError("Invalid or expired verification token");
    }

    // Check if token is expired
    if (
      !user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()
    ) {
      throw new BadRequestError("Verification token has expired");
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new BadRequestError("Email is already verified");
    }

    // Mark email as verified and clear token
    await db
      .update(users)
      .set({
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpiry: null,
      })
      .where(eq(users.id, user.id));

    const { password: _, ...safeUser } = user;
    return { ...safeUser, isEmailVerified: true };
  }

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(userId: number): Promise<void> {
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new UnauthorizedError("User not found");
    }

    // Check if already verified
    if (user.isEmailVerified) {
      throw new BadRequestError("Email is already verified");
    }

    // Generate new verification token
    const verificationToken = this.generateToken();
    const verificationExpiry = new Date();
    verificationExpiry.setHours(verificationExpiry.getHours() + 24); // 24 hour expiry

    // Store token in database
    await db
      .update(users)
      .set({
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry,
      })
      .where(eq(users.id, user.id));

    // Build verification URL
    const storefrontUrl = Deno.env.get("STOREFRONT_URL") ||
      Deno.env.get("APP_URL") || "http://localhost:3000";
    const verificationUrl =
      `${storefrontUrl}/verify-email?token=${verificationToken}`;

    // Send email (fire-and-forget)
    const userName = user.username || user.firstName ||
      user.email.split("@")[0];
    notificationService.sendVerificationEmail(
      user.email,
      userName,
      verificationUrl,
    );
  }

  /**
   * Send verification email during registration
   * Called internally after user creation
   */
  static async sendVerificationEmailForNewUser(userId: number): Promise<void> {
    await this.resendVerificationEmail(userId);
  }
}
