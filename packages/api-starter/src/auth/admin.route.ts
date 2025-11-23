import { Hono } from "hono";
import { AdminController } from "./admin.controller.ts";
import { requireAuth } from "../shared/middleware/requireAuth.ts";
import { requireSuperadmin } from "../shared/middleware/requireRole.ts";

const adminRoutes = new Hono();

/**
 * Admin Routes
 *
 * All routes require authentication + superadmin role
 * Only the system-defined superadmin can manage users and admins
 */

// Create admin/moderator (superadmin only)
adminRoutes.post(
  "/admin/users",
  requireAuth,
  requireSuperadmin,
  AdminController.createAdmin,
);

// Get all users (superadmin only)
adminRoutes.get(
  "/admin/users",
  requireAuth,
  requireSuperadmin,
  AdminController.getAllUsers,
);

// Get user by ID (superadmin only)
adminRoutes.get(
  "/admin/users/:id",
  requireAuth,
  requireSuperadmin,
  AdminController.getUserById,
);

// Update user (superadmin only)
adminRoutes.put(
  "/admin/users/:id",
  requireAuth,
  requireSuperadmin,
  AdminController.updateUser,
);

// Delete user (superadmin only)
adminRoutes.delete(
  "/admin/users/:id",
  requireAuth,
  requireSuperadmin,
  AdminController.deleteUser,
);

export default adminRoutes;
