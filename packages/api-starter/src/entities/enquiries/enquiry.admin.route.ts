import { Hono } from "hono";
import { DrizzleAdapter, HonoAdminAdapter } from "@tstack/admin";
import { db } from "../../config/database.ts";
import { enquiries } from "./enquiry.model.ts";
import { requireAuth } from "../../shared/middleware/requireAuth.ts";

/**
 * Enquiry Admin Routes
 *
 * Admin panel for managing contact form submissions.
 * Provides CRUD operations with:
 * - List with pagination, search, and sorting
 * - Status management (new, read, replied, spam, archived)
 * - Admin notes
 * - Bulk operations (delete, mark as spam)
 */

// Admin base URL constant
const ADMIN_BASE_URL = "/ts-admin/enquiries";

// Create ORM adapter for enquiries
const ormAdapter = new DrizzleAdapter(enquiries, {
  db,
  idColumn: "id",
  idType: "number",
});

// Create admin adapter with CRUD configuration
const enquiryAdmin = new HonoAdminAdapter({
  ormAdapter,
  entityName: "enquiry",
  entityNamePlural: "enquiries",
  columns: [
    "id",
    "name",
    "email",
    "phone",
    "company",
    "subject",
    "message",
    "status",
    "adminNotes",
    "ipAddress",
    "userAgent",
    "referrer",
    "honeypotTriggered",
    "formLoadedAt",
    "readAt",
    "repliedAt",
    "readBy",
    "repliedBy",
    "createdAt",
    "updatedAt",
  ],
  searchable: ["name", "email", "phone", "company", "subject", "message"],
  sortable: ["id", "name", "email", "status", "createdAt", "updatedAt"],
  allowedRoles: ["superadmin", "admin"],
  baseUrl: ADMIN_BASE_URL,
});

// Register admin routes (requires authentication)
const enquiryAdminRoutes = new Hono();

// Apply authentication middleware to all admin routes
enquiryAdminRoutes.use(`${ADMIN_BASE_URL}/*`, requireAuth);
enquiryAdminRoutes.use(ADMIN_BASE_URL, requireAuth);

// CRUD routes
enquiryAdminRoutes.get(ADMIN_BASE_URL, enquiryAdmin.list());
enquiryAdminRoutes.get(`${ADMIN_BASE_URL}/new`, enquiryAdmin.new());
enquiryAdminRoutes.post(ADMIN_BASE_URL, enquiryAdmin.create());
enquiryAdminRoutes.get(`${ADMIN_BASE_URL}/:id`, enquiryAdmin.show());
enquiryAdminRoutes.get(`${ADMIN_BASE_URL}/:id/edit`, enquiryAdmin.edit());
enquiryAdminRoutes.put(`${ADMIN_BASE_URL}/:id`, enquiryAdmin.update());
enquiryAdminRoutes.patch(`${ADMIN_BASE_URL}/:id`, enquiryAdmin.update());
enquiryAdminRoutes.delete(`${ADMIN_BASE_URL}/:id`, enquiryAdmin.destroy());
enquiryAdminRoutes.post(
  `${ADMIN_BASE_URL}/bulk-delete`,
  enquiryAdmin.bulkDelete(),
);

export default enquiryAdminRoutes;
