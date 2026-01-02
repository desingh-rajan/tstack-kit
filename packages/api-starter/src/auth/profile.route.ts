import { Hono } from "hono";
import { ProfileController } from "./profile.controller.ts";
import { requireAuth } from "../shared/middleware/requireAuth.ts";

/**
 * Profile Routes
 *
 * User profile management endpoints
 * All routes require authentication
 *
 * GET    /users/me/profile     - Get current user's profile
 * PUT    /users/me/profile     - Update profile
 * POST   /users/me/avatar      - Upload/update avatar
 * DELETE /users/me/avatar      - Remove avatar
 */
const profileRoutes = new Hono();

// Apply authentication to all routes
profileRoutes.use("/users/me/*", requireAuth);

// Profile endpoints
profileRoutes.get("/users/me/profile", ProfileController.getProfile);
profileRoutes.put("/users/me/profile", ProfileController.updateProfile);

// Avatar endpoints
profileRoutes.post("/users/me/avatar", ProfileController.uploadAvatar);
profileRoutes.delete("/users/me/avatar", ProfileController.deleteAvatar);

export default profileRoutes;
