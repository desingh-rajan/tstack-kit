import { Hono } from "hono";
import { AddressController } from "./address.controller.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * Address Routes (User)
 *
 * All routes require authentication and enforce user ownership
 *
 * GET    /addresses                 - List user's addresses
 * POST   /addresses                 - Create address
 * GET    /addresses/default/:type   - Get default address (shipping/billing)
 * GET    /addresses/:id             - Get address by ID
 * PUT    /addresses/:id             - Update address
 * DELETE /addresses/:id             - Delete address
 * PUT    /addresses/:id/default     - Set as default
 */
const addressRoutes = new Hono();

// Apply authentication to all routes
addressRoutes.use("/addresses/*", requireAuth);
addressRoutes.use("/addresses", requireAuth);

// List all addresses
addressRoutes.get("/addresses", AddressController.list);

// Create new address
addressRoutes.post("/addresses", AddressController.create);

// Get default address by type (must be before :id route)
addressRoutes.get("/addresses/default/:type", AddressController.getDefault);

// Get address by ID
addressRoutes.get("/addresses/:id", AddressController.getById);

// Update address
addressRoutes.put("/addresses/:id", AddressController.update);

// Delete address
addressRoutes.delete("/addresses/:id", AddressController.delete);

// Set address as default
addressRoutes.put("/addresses/:id/default", AddressController.setDefault);

export default addressRoutes;
