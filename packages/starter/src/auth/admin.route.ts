import { Hono } from "hono";
import { AdminController } from "./admin.controller.ts";
import { requireAuth } from "../shared/middleware/requireAuth.ts";

const adminRoutes = new Hono();

// All admin routes require authentication
adminRoutes.use("*", requireAuth);

// Admin management routes
adminRoutes.post("/admin/users", AdminController.createAdmin);
adminRoutes.get("/admin/users", AdminController.getAllUsers);
adminRoutes.get("/admin/users/:id", AdminController.getUserById);
adminRoutes.put("/admin/users/:id", AdminController.updateUser);
adminRoutes.delete("/admin/users/:id", AdminController.deleteUser);

export default adminRoutes;
