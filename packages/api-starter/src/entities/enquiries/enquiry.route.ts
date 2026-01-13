import { Hono } from "hono";
import { EnquiryControllerStatic } from "./enquiry.controller.ts";
import { validate } from "../../shared/middleware/validate.ts";
import { CreateEnquirySchema } from "./enquiry.dto.ts";
import { rateLimit } from "../../shared/middleware/rateLimit.ts";

/**
 * Public Contact Form Route
 *
 * POST /api/contact - Submit contact form (no auth required)
 *
 * Features:
 * - Rate limiting (3 submissions per 10 minutes per IP)
 * - Honeypot field validation (anti-spam)
 * - Time-based validation (anti-spam)
 */

const contactRoutes = new Hono();

// Apply rate limiting - 3 requests per 10 minutes per IP
const contactRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3,
  message: "Too many submissions. Please try again later.",
});

// Public contact form submission
contactRoutes.post(
  "/contact",
  contactRateLimit,
  validate(CreateEnquirySchema),
  EnquiryControllerStatic.submit,
);

export default contactRoutes;
