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

// Email Verification DTOs
export const VerifyEmailSchema = z.object({
  token: z.string().min(1, "Verification token is required"),
});

export type VerifyEmailDTO = z.infer<typeof VerifyEmailSchema>;

export const ResendVerificationSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ResendVerificationDTO = z.infer<typeof ResendVerificationSchema>;

// Password Reset DTOs
export const ForgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type ForgotPasswordDTO = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type ResetPasswordDTO = z.infer<typeof ResetPasswordSchema>;

export const ValidateResetTokenSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
});

export type ValidateResetTokenDTO = z.infer<typeof ValidateResetTokenSchema>;
