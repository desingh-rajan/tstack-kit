import { Context } from "hono";
import { ProfileService } from "./profile.service.ts";
import { ValidationUtil } from "../shared/utils/validation.ts";
import { ApiResponse } from "../shared/utils/response.ts";
import { UpdateProfileSchema } from "./profile.dto.ts";
import { z } from "zod";

/**
 * Profile Controller
 *
 * User profile endpoints
 * All endpoints require authentication
 */
export class ProfileController {
  /**
   * GET /users/me/profile - Get current user's profile
   */
  static async getProfile(c: Context) {
    const userId = c.get("userId") as number;
    const profile = await ProfileService.getProfile(userId);

    return c.json(ApiResponse.success(profile));
  }

  /**
   * PUT /users/me/profile - Update current user's profile
   */
  static async updateProfile(c: Context) {
    const userId = c.get("userId") as number;
    const body = await c.req.json();
    const validatedData = ValidationUtil.validateSync(
      UpdateProfileSchema,
      body,
    );

    const profile = await ProfileService.updateProfile(userId, validatedData);

    return c.json(
      ApiResponse.success(profile, "Profile updated successfully"),
    );
  }

  /**
   * POST /users/me/avatar - Upload/Update avatar
   *
   * Accepts either:
   * - JSON body with { avatarUrl: "https://..." }
   * - Multipart form data with avatar file (future: upload to S3)
   */
  static async uploadAvatar(c: Context) {
    const userId = c.get("userId") as number;
    const contentType = c.req.header("Content-Type") || "";

    if (contentType.includes("application/json")) {
      // JSON body with URL
      const body = await c.req.json();
      const schema = z.object({
        avatarUrl: z.string().url("Invalid URL"),
      });
      const { avatarUrl } = ValidationUtil.validateSync(schema, body);

      const profile = await ProfileService.updateAvatar(userId, avatarUrl);

      return c.json(
        ApiResponse.success(profile, "Avatar updated successfully"),
      );
    }

    // TODO: Handle multipart form data for file upload
    // For now, return an error
    return c.json(
      ApiResponse.error(
        "File upload not yet implemented. Please provide avatarUrl in JSON body.",
      ),
      400,
    );
  }

  /**
   * DELETE /users/me/avatar - Remove avatar
   */
  static async deleteAvatar(c: Context) {
    const userId = c.get("userId") as number;

    const profile = await ProfileService.deleteAvatar(userId);

    return c.json(
      ApiResponse.success(profile, "Avatar removed successfully"),
    );
  }
}
