import { eq } from "drizzle-orm";
import { db } from "../config/database.ts";
import { users } from "./user.model.ts";
import { NotFoundError } from "../shared/utils/errors.ts";
import type {
  UpdateProfileDTO,
  UserProfileResponseDTO,
} from "./profile.dto.ts";

/**
 * Profile Service
 *
 * Handles user profile operations
 */
export class ProfileService {
  /**
   * Get user profile
   */
  static async getProfile(userId: number): Promise<UserProfileResponseDTO> {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        role: users.role,
        isEmailVerified: users.isEmailVerified,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        googleId: users.googleId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (result.length === 0) {
      throw new NotFoundError("User not found");
    }

    const user = result[0];

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      hasGoogleLinked: user.googleId !== null,
    };
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: number,
    data: UpdateProfileDTO,
  ): Promise<UserProfileResponseDTO> {
    const result = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        role: users.role,
        isEmailVerified: users.isEmailVerified,
        isActive: users.isActive,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        googleId: users.googleId,
      });

    if (result.length === 0) {
      throw new NotFoundError("User not found");
    }

    const user = result[0];

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      hasGoogleLinked: user.googleId !== null,
    };
  }

  /**
   * Update avatar URL
   *
   * Note: This just updates the URL. Actual file upload to S3/storage
   * should be handled by a separate storage service.
   */
  static updateAvatar(
    userId: number,
    avatarUrl: string,
  ): Promise<UserProfileResponseDTO> {
    return this.updateProfile(userId, { avatarUrl });
  }

  /**
   * Delete avatar (set to null)
   */
  static deleteAvatar(userId: number): Promise<UserProfileResponseDTO> {
    return this.updateProfile(userId, { avatarUrl: null });
  }
}
