/**
 * Enquiry TypeScript types
 * Matches backend enquiry.model.ts and enquiry.dto.ts
 */

export type EnquiryStatus = "new" | "read" | "replied" | "spam" | "archived";

export interface Enquiry extends Record<string, unknown> {
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
  formLoadedAt: string | null;
  readAt: string | null;
  repliedAt: string | null;
  readBy: number | null;
  repliedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateEnquiryInput {
  status?: EnquiryStatus;
  adminNotes?: string | null;
}

export interface EnquiryListResponse {
  success: boolean;
  data: Enquiry[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface EnquiryResponse {
  success: boolean;
  data: Enquiry;
}

export interface DeleteEnquiryResponse {
  success: boolean;
  message: string;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}

export interface BulkSpamResponse {
  success: boolean;
  message: string;
  count: number;
}
