import { and, eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { type SafeUser, users } from "./user.model.ts";
import { authTokens } from "./auth-token.model.ts";
import { hashPassword, verifyPassword } from "../shared/utils/password.ts";
import { createToken } from "../shared/utils/jwt.ts";
import { BadRequestError, UnauthorizedError } from "../shared/utils/errors.ts";

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
}
