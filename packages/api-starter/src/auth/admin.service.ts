import { eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { type SafeUser, users } from "./user.model.ts";
import { hashPassword } from "../shared/utils/password.ts";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../shared/utils/errors.ts";

export class AdminService {
  /**
   * Create a new admin user (only superadmin can do this)
   */
  static async createAdmin(
    data: {
      email: string;
      password: string;
      username: string;
      role?: "admin" | "moderator";
    },
    requestingUser: { role: string },
  ): Promise<SafeUser> {
    // Only superadmin can create admins/moderators
    if (requestingUser.role !== "superadmin") {
      throw new ForbiddenError(
        "Only superadmin can create admin or moderator users",
      );
    }

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

    // Create admin user (default to "admin" role)
    const [newAdmin] = await db
      .insert(users)
      .values({
        email: data.email,
        username: data.username,
        password: hashedPassword,
        role: data.role || "admin", // Can be admin or moderator, NOT superadmin
        isActive: true,
        isEmailVerified: true, // Admins are verified by default
      })
      .returning();

    // Return admin without password
    const { password: _, ...safeAdmin } = newAdmin;
    return safeAdmin;
  }

  /**
   * Get all users (paginated)
   */
  static async getAllUsers(page = 1, limit = 20): Promise<{
    users: SafeUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const offset = (page - 1) * limit;

    // Get users
    const userList = await db
      .select()
      .from(users)
      .limit(limit)
      .offset(offset);

    // Get total count
    const totalResult = await db.select().from(users);
    const total = totalResult.length;

    // Remove passwords
    const safeUsers = userList.map(({ password: _, ...user }) => user);

    return {
      users: safeUsers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: number): Promise<SafeUser> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  /**
   * Update user (email, username, active status)
   */
  static async updateUser(
    userId: number,
    currentUserId: number,
    data: {
      username?: string;
      email?: string;
      isActive?: boolean;
    },
  ): Promise<SafeUser> {
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if trying to modify superadmin (system-defined, cannot be changed)
    if (user.role === "superadmin" && userId !== currentUserId) {
      throw new ForbiddenError("Cannot modify superadmin account");
    }

    // Check if email is already taken
    if (data.email && data.email !== user.email) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new BadRequestError("Email already in use");
      }
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    const { password: _, ...safeUser } = updatedUser;
    return safeUser;
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  static async deleteUser(
    userId: number,
    currentUserId: number,
  ): Promise<void> {
    // Get user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Prevent deleting superadmin (system-defined, protected)
    if (user.role === "superadmin") {
      throw new ForbiddenError("Cannot delete superadmin account");
    }

    // Prevent self-deletion
    if (userId === currentUserId) {
      throw new ForbiddenError("Cannot delete your own account");
    }

    // Soft delete by deactivating
    await db
      .update(users)
      .set({ isActive: false })
      .where(eq(users.id, userId));
  }
}
