import { Hono } from "hono";
import { AdminController } from "./admin.controller.ts";
import { requireAuth } from "../shared/middleware/requireAuth.ts";

const adminRoutes = new Hono();

// All admin routes require authentication
adminRoutes.post("/admin/users", requireAuth, AdminController.createAdmin);
adminRoutes.get("/admin/users", requireAuth, AdminController.getAllUsers);
adminRoutes.get("/admin/users/:id", requireAuth, AdminController.getUserById);
adminRoutes.put("/admin/users/:id", requireAuth, AdminController.updateUser);
adminRoutes.delete("/admin/users/:id", requireAuth, AdminController.deleteUser);

export default adminRoutes;
