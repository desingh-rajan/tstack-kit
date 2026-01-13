import { z } from "zod";
import type { EnquiryStatus } from "./enquiry.model.ts";

/**
 * Enquiry DTOs
 *
 * Validation for:
 * - Public contact form submissions (with honeypot)
 * - Admin status updates
 * - Admin notes updates
 */

// Public contact form submission
// Note: Either email or phone is required (validated with refine)
export const CreateEnquirySchema = z.object({
  name: z.string().max(255, "Name too long").optional(),
  email: z.string().email("Invalid email address").max(255).optional(),
  phone: z.string().max(50, "Phone number too long").optional(),
  company: z.string().max(255, "Company name too long").optional(),
  subject: z.string().max(255, "Subject too long").optional(),
  message: z.string().min(1, "Message is required").max(
    5000,
    "Message too long",
  ),

  // Honeypot field - should be empty (bots often fill this)
  website: z.string().max(255).optional(),

  // Form loaded timestamp for time-based validation
  formLoadedAt: z.string().datetime().optional(),
}).refine(
  (data) => data.email || data.phone,
  {
    message: "Either email or phone is required",
    path: ["email"],
  },
);

export type CreateEnquiryDTO = z.infer<typeof CreateEnquirySchema>;

// Admin update status
export const UpdateEnquiryStatusSchema = z.object({
  status: z.enum(["new", "read", "replied", "spam", "archived"]),
});

export type UpdateEnquiryStatusDTO = z.infer<typeof UpdateEnquiryStatusSchema>;

// Admin update notes
export const UpdateEnquiryNotesSchema = z.object({
  adminNotes: z.string().max(5000, "Notes too long").nullable(),
});

export type UpdateEnquiryNotesDTO = z.infer<typeof UpdateEnquiryNotesSchema>;

// Full admin update (status + notes)
export const UpdateEnquirySchema = z.object({
  status: z.enum(["new", "read", "replied", "spam", "archived"]).optional(),
  adminNotes: z.string().max(5000).nullable().optional(),
});

export type UpdateEnquiryDTO = z.infer<typeof UpdateEnquirySchema>;

// Response DTO
export interface EnquiryResponseDTO {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  subject: string | null;
  message: string;
  status: EnquiryStatus;
  adminNotes: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  referrer: string | null;
  honeypotTriggered: boolean;
  formLoadedAt: Date | null;
  readAt: Date | null;
  repliedAt: Date | null;
  readBy: number | null;
  repliedBy: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Public submission response (limited info)
export interface EnquirySubmitResponseDTO {
  success: boolean;
  message: string;
}
