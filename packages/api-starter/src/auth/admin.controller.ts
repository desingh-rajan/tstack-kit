import { Context } from "hono";
import { AdminService } from "./admin.service.ts";
import {
  CreateAdminSchema,
  GetUsersQuerySchema,
  UpdateUserSchema,
} from "./admin.dto.ts";
import { ValidationUtil } from "../shared/utils/validation.ts";
import { ApiResponse } from "../shared/utils/response.ts";
import { BadRequestError } from "../shared/utils/errors.ts";

/** Parse a route param as a positive integer or throw. */
function requireIntParam(c: Context, name: string): number {
  const val = parseInt(c.req.param(name), 10);
  if (isNaN(val) || val <= 0) {
    throw new BadRequestError(`Invalid ${name}: must be a positive integer`);
  }
  return val;
}

export class AdminController {
  /**
   * Create a new admin user (only superadmin can do this)
   * POST /admin/users
   */
  static async createAdmin(c: Context) {
    const user = c.get("user");
    const body = await c.req.json();
    const validatedData = ValidationUtil.validate(CreateAdminSchema, body);

    const admin = await AdminService.createAdmin(validatedData, user);

    return c.json(
      ApiResponse.success(admin, "Admin created successfully"),
      201,
    );
  }

  /**
   * Get all users (paginated)
   * GET /admin/users?page=1&limit=20
   */
  static async getAllUsers(c: Context) {
    const query = {
      page: c.req.query("page"),
      limit: c.req.query("limit"),
    };
    const { page, limit } = ValidationUtil.validate(
      GetUsersQuerySchema,
      query,
    );

    const result = await AdminService.getAllUsers(page, limit);

    return c.json(ApiResponse.success(result, "Users retrieved successfully"));
  }

  /**
   * Get user by ID
   * GET /admin/users/:id
   */
  static async getUserById(c: Context) {
    const userId = requireIntParam(c, "id");
    const user = await AdminService.getUserById(userId);

    return c.json(ApiResponse.success(user, "User retrieved successfully"));
  }

  /**
   * Update user
   * PUT /admin/users/:id
   */
  static async updateUser(c: Context) {
    const userId = requireIntParam(c, "id");
    const currentUserId = c.get("userId");
    const body = await c.req.json();
    const validatedData = ValidationUtil.validate(UpdateUserSchema, body);

    const user = await AdminService.updateUser(
      userId,
      currentUserId,
      validatedData,
    );

    return c.json(ApiResponse.success(user, "User updated successfully"));
  }

  /**
   * Delete user (soft delete)
   * DELETE /admin/users/:id
   */
  static async deleteUser(c: Context) {
    const userId = requireIntParam(c, "id");
    const currentUserId = c.get("userId");

    await AdminService.deleteUser(userId, currentUserId);

    return c.json(ApiResponse.success(null, "User deleted successfully"));
  }
}
