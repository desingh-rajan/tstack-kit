import { z } from "zod";

/**
 * User Profile DTOs
 *
 * Validation schemas for user profile operations
 */

// Update Profile DTO
export const UpdateProfileSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters")
    .max(50, "Username too long").optional().nullable(),
  firstName: z.string().max(100, "First name too long").optional().nullable(),
  lastName: z.string().max(100, "Last name too long").optional().nullable(),
  phone: z.string()
    .max(15, "Phone number too long")
    .regex(/^(\+91)?[6-9]\d{9}$/, "Invalid Indian phone number")
    .optional()
    .nullable(),
  avatarUrl: z.string().url("Invalid URL").max(500).optional().nullable(),
});

export type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>;

// User Profile Response DTO
export interface UserProfileResponseDTO {
  id: number;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  // OAuth linked accounts
  hasGoogleLinked: boolean;
}

// Avatar Upload Response
export interface AvatarUploadResponseDTO {
  avatarUrl: string;
}
