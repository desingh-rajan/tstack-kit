import { Context } from "hono";
import { enquiryService } from "./enquiry.service.ts";
import { ApiResponse } from "../../shared/utils/response.ts";
import { BadRequestError, NotFoundError } from "../../shared/utils/errors.ts";
import type {
  UpdateEnquiryNotesDTO,
  UpdateEnquiryStatusDTO,
} from "./enquiry.dto.ts";

/** Parse a route param as a positive integer or throw. */
function requireIntParam(c: Context, name: string): number {
  const val = parseInt(c.req.param(name), 10);
  if (isNaN(val) || val <= 0) {
    throw new BadRequestError(`Invalid ${name}: must be a positive integer`);
  }
  return val;
}

/**
 * Enquiry Controller
 *
 * Handles:
 * - Public contact form submissions (no auth)
 * - Admin CRUD operations (requires auth)
 */
export class EnquiryController {
  /**
   * Public: Submit contact form
   * POST /api/contact
   */
  static submit = async (c: Context) => {
    const validatedData = c.get("validatedData");

    // Extract metadata from request
    const metadata = {
      ipAddress: c.req.header("x-forwarded-for") || c.req.header("x-real-ip") ||
        "unknown",
      userAgent: c.req.header("user-agent") || undefined,
      referrer: c.req.header("referer") || undefined,
    };

    // Store result but don't expose internals to client
    await enquiryService.createFromPublicSubmission(
      validatedData,
      metadata,
    );

    // Always return success to not reveal spam detection
    return c.json(
      ApiResponse.success(
        { submitted: true },
        "Thank you for your message. We will get back to you soon.",
      ),
      201,
    );
  };

  /**
   * Admin: Get all enquiries
   * GET /api/enquiries
   */
  static getAll = async (c: Context) => {
    const enquiries = await enquiryService.getAll();
    return c.json(ApiResponse.success(enquiries));
  };

  /**
   * Admin: Get enquiry by ID
   * GET /api/enquiries/:id
   */
  static getById = async (c: Context) => {
    const id = requireIntParam(c, "id");
    const enquiry = await enquiryService.getById(id);

    if (!enquiry) {
      throw new NotFoundError("Enquiry not found");
    }

    return c.json(ApiResponse.success(enquiry));
  };

  /**
   * Admin: Update enquiry status
   * PATCH /api/enquiries/:id/status
   */
  static updateStatus = async (c: Context) => {
    const id = requireIntParam(c, "id");
    const user = c.get("user");
    const { status } = c.get("validatedData") as UpdateEnquiryStatusDTO;

    const enquiry = await enquiryService.updateStatus(id, status, user?.id);

    if (!enquiry) {
      throw new NotFoundError("Enquiry not found");
    }

    return c.json(ApiResponse.success(enquiry, "Status updated successfully"));
  };

  /**
   * Admin: Update enquiry notes
   * PATCH /api/enquiries/:id/notes
   */
  static updateNotes = async (c: Context) => {
    const id = requireIntParam(c, "id");
    const { adminNotes } = c.get("validatedData") as UpdateEnquiryNotesDTO;

    const enquiry = await enquiryService.updateNotes(id, adminNotes);

    if (!enquiry) {
      throw new NotFoundError("Enquiry not found");
    }

    return c.json(ApiResponse.success(enquiry, "Notes updated successfully"));
  };

  /**
   * Admin: Delete enquiry
   * DELETE /api/enquiries/:id
   */
  static delete = async (c: Context) => {
    const id = requireIntParam(c, "id");

    const deleted = await enquiryService.delete(id);

    if (!deleted) {
      throw new NotFoundError("Enquiry not found");
    }

    return c.json(ApiResponse.success(null, "Enquiry deleted successfully"));
  };

  /**
   * Admin: Bulk mark as spam
   * POST /api/enquiries/bulk-spam
   */
  static bulkMarkAsSpam = async (c: Context) => {
    const { ids } = await c.req.json<{ ids: number[] }>();

    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json(ApiResponse.error("No IDs provided"), 400);
    }

    const count = await enquiryService.bulkMarkAsSpam(ids);

    return c.json(
      ApiResponse.success({ count }, `${count} enquiries marked as spam`),
    );
  };

  /**
   * Admin: Bulk delete
   * POST /api/enquiries/bulk-delete
   */
  static bulkDelete = async (c: Context) => {
    const { ids } = await c.req.json<{ ids: number[] }>();

    if (!Array.isArray(ids) || ids.length === 0) {
      return c.json(ApiResponse.error("No IDs provided"), 400);
    }

    const count = await enquiryService.bulkDelete(ids);

    return c.json(ApiResponse.success({ count }, `${count} enquiries deleted`));
  };
}

export const EnquiryControllerStatic = EnquiryController;
