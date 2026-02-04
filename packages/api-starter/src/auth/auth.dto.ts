import { z } from "zod";

// Register DTO
export const RegisterSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z.string().min(3).max(50).optional(),
  phone: z.string().optional(),
});

export type RegisterDTO = z.infer<typeof RegisterSchema>;

// Login DTO
export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginDTO = z.infer<typeof LoginSchema>;

// Change Password DTO
export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export type ChangePasswordDTO = z.infer<typeof ChangePasswordSchema>;

// Forgot Password DTO
export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;

// Reset Password DTO
export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;

// Verify Email DTO
export const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export type VerifyEmailDTO = z.infer<typeof VerifyEmailSchema>;
