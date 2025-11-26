import { Context } from "hono";
import { AuthService } from "./auth.service.ts";
import { ValidationUtil } from "../shared/utils/validation.ts";
import { ApiResponse } from "../shared/utils/response.ts";
import {
  ChangePasswordSchema,
  LoginSchema,
  RegisterSchema,
} from "./auth.dto.ts";
import { extractTokenFromHeader } from "../shared/utils/jwt.ts";

export class AuthController {
  // POST /api/auth/register
  static async register(c: Context) {
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(RegisterSchema, body);

    const { user, token } = await AuthService.register(validatedData);

    return c.json(
      ApiResponse.success({ user, token }, "User registered successfully"),
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
}
