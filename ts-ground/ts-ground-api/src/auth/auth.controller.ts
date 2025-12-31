import { Context } from "hono";
import { AuthService } from "./auth.service.ts";
import { ValidationUtil } from "../shared/utils/validation.ts";
import { ApiResponse } from "../shared/utils/response.ts";
import {
  ChangePasswordSchema,
  ForgotPasswordSchema,
  LoginSchema,
  RegisterSchema,
  ResendVerificationSchema,
  ResetPasswordSchema,
  ValidateResetTokenSchema,
  VerifyEmailSchema,
} from "./auth.dto.ts";
import { extractTokenFromHeader } from "../shared/utils/jwt.ts";

export class AuthController {
  // POST /api/auth/register
  static async register(c: Context) {
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(RegisterSchema, body);

    const { user, token } = await AuthService.register(validatedData);

    return c.json(
      ApiResponse.success(
        { user, token },
        "User registered successfully. Please check your email to verify your account.",
      ),
      201,
    );
  }

  // POST /api/auth/login
  static async login(c: Context) {
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(LoginSchema, body);

    const { user, token } = await AuthService.login(validatedData);

    return c.json(
      ApiResponse.success({ user, token }, "Login successful"),
      200,
    );
  }

  // POST /api/auth/logout
  static async logout(c: Context) {
    const authHeader = c.req.header("Authorization");
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      await AuthService.logout(token);
    }

    return c.json(
      ApiResponse.success(null, "Logout successful"),
      200,
    );
  }

  // GET /api/auth/me
  static async getCurrentUser(c: Context) {
    const userId = c.get("userId") as number;
    const user = await AuthService.getCurrentUser(userId);

    return c.json(
      ApiResponse.success(user, "User retrieved successfully"),
      200,
    );
  }

  // PUT /api/auth/change-password
  static async changePassword(c: Context) {
    const userId = c.get("userId") as number;
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(
      ChangePasswordSchema,
      body,
    );

    await AuthService.changePassword(
      userId,
      validatedData.currentPassword,
      validatedData.newPassword,
    );

    return c.json(
      ApiResponse.success(null, "Password changed successfully"),
      200,
    );
  }

  // ============================================
  // Email Verification Endpoints
  // ============================================

  // POST /api/auth/send-verification
  static async sendVerificationEmail(c: Context) {
    const userId = c.get("userId") as number;
    await AuthService.sendVerificationEmail(userId);

    return c.json(
      ApiResponse.success(null, "Verification email sent successfully"),
      200,
    );
  }

  // POST /api/auth/resend-verification
  static async resendVerificationEmail(c: Context) {
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(
      ResendVerificationSchema,
      body,
    );

    await AuthService.resendVerificationEmail(validatedData.email);

    // Always return success to prevent email enumeration
    return c.json(
      ApiResponse.success(
        null,
        "If an account exists with this email, a verification link has been sent.",
      ),
      200,
    );
  }

  // GET /api/auth/verify-email?token=xxx
  // POST /api/auth/verify-email { token: "xxx" }
  static async verifyEmail(c: Context) {
    // Support both query param and body
    let token: string;
    if (c.req.method === "GET") {
      token = c.req.query("token") || "";
    } else {
      const body = await c.req.json();
      const validatedData = ValidationUtil.validateSync(
        VerifyEmailSchema,
        body,
      );
      token = validatedData.token;
    }

    if (!token) {
      return c.json(
        ApiResponse.error("Verification token is required"),
        400,
      );
    }

    const user = await AuthService.verifyEmail(token);

    return c.json(
      ApiResponse.success(user, "Email verified successfully"),
      200,
    );
  }

  // ============================================
  // Password Reset Endpoints
  // ============================================

  // POST /api/auth/forgot-password
  static async forgotPassword(c: Context) {
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(
      ForgotPasswordSchema,
      body,
    );

    await AuthService.forgotPassword(validatedData.email);

    // Always return success to prevent email enumeration
    return c.json(
      ApiResponse.success(
        null,
        "If an account exists with this email, a password reset link has been sent.",
      ),
      200,
    );
  }

  // POST /api/auth/reset-password
  static async resetPassword(c: Context) {
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(
      ResetPasswordSchema,
      body,
    );

    await AuthService.resetPassword(
      validatedData.token,
      validatedData.password,
    );

    return c.json(
      ApiResponse.success(
        null,
        "Password reset successfully. Please login with your new password.",
      ),
      200,
    );
  }

  // GET /api/auth/validate-reset-token?token=xxx
  // POST /api/auth/validate-reset-token { token: "xxx" }
  static async validateResetToken(c: Context) {
    let token: string;
    if (c.req.method === "GET") {
      token = c.req.query("token") || "";
    } else {
      const body = await c.req.json();
      const validatedData = ValidationUtil.validateSync(
        ValidateResetTokenSchema,
        body,
      );
      token = validatedData.token;
    }

    if (!token) {
      return c.json(
        ApiResponse.error("Reset token is required"),
        400,
      );
    }

    const isValid = await AuthService.validateResetToken(token);

    return c.json(
      ApiResponse.success(
        { valid: isValid },
        isValid ? "Token is valid" : "Token is invalid or expired",
      ),
      200,
    );
  }
}
