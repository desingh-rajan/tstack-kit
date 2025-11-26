/**
 * User TypeScript types
 * Matches backend user.model.ts and admin.dto.ts
 */

export type UserRole = "superadmin" | "admin" | "moderator" | "user";

export interface User extends Record<string, unknown> {
  id: number;
  username?: string | null;
  email: string;
  phone?: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  role?: "admin" | "moderator";
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  isActive?: boolean;
}

export interface UserListResponse {
  success: boolean;
  data: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserResponse {
  success: boolean;
  data: User;
}

export interface DeleteUserResponse {
  success: boolean;
  message: string;
}
