import { desc, eq } from "drizzle-orm";
import { db } from "../../config/database.ts";
import {
  enquiries,
  ENQUIRY_STATUS,
  type EnquiryStatus,
} from "./enquiry.model.ts";
import type {
  CreateEnquiryDTO,
  EnquiryResponseDTO,
  UpdateEnquiryDTO,
} from "./enquiry.dto.ts";
import { SiteSettingService } from "../site_settings/site-setting.service.ts";
import { BaseService } from "../../shared/services/base.service.ts";
import type { Enquiry } from "./enquiry.model.ts";

// Minimum time between form load and submit (in ms) - submissions faster than this are likely bots
const MIN_SUBMISSION_TIME_MS = 3000; // 3 seconds

/**
 * Enquiry Service
 *
 * Handles contact form submissions with:
 * - Anti-spam validation (honeypot, time-based)
 * - Email notifications to admin
 * - Status management
 */
export class EnquiryService extends BaseService<
  Enquiry,
  CreateEnquiryDTO,
  UpdateEnquiryDTO,
  EnquiryResponseDTO
> {
  constructor() {
    super(db, enquiries);
  }

  /**
   * Override: Get all enquiries ordered by newest first
   */
  override async getAll(): Promise<EnquiryResponseDTO[]> {
    const result = await db
      .select()
      .from(enquiries)
      .orderBy(desc(enquiries.createdAt));

    return result as EnquiryResponseDTO[];
  }

  /**
   * Get enquiry by ID
   */
  override async getById(id: number): Promise<EnquiryResponseDTO | null> {
    const result = await db
      .select()
      .from(enquiries)
      .where(eq(enquiries.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    return result[0] as EnquiryResponseDTO;
  }

  /**
   * Create new enquiry from public form submission
   *
   * @param data - Form data from public submission
   * @param metadata - Request metadata (IP, user agent, referrer)
   * @returns Created enquiry or null if spam detected
   */
  async createFromPublicSubmission(
    data: CreateEnquiryDTO,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      referrer?: string;
    },
  ): Promise<
    { enquiry: EnquiryResponseDTO | null; isSpam: boolean; reason?: string }
  > {
    // Check honeypot field - if filled, it's likely a bot
    const honeypotTriggered = Boolean(
      data.website && data.website.trim() !== "",
    );

    // Check time-based validation
    let isTooFast = false;
    if (data.formLoadedAt) {
      const loadTime = new Date(data.formLoadedAt).getTime();
      const submitTime = Date.now();
      const timeDiff = submitTime - loadTime;
      isTooFast = timeDiff < MIN_SUBMISSION_TIME_MS;
    }

    // Determine if this is spam
    const isSpam = honeypotTriggered || isTooFast;
    let spamReason: string | undefined;
    if (honeypotTriggered) {
      spamReason = "Honeypot field was filled";
    } else if (isTooFast) {
      spamReason = "Form submitted too quickly";
    }

    // Create the enquiry record (even spam ones, for auditing)
    const [newRecord] = await db
      .insert(enquiries)
      .values({
        name: data.name || null,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        subject: data.subject || null,
        message: data.message,
        status: isSpam ? ENQUIRY_STATUS.SPAM : ENQUIRY_STATUS.NEW,
        ipAddress: metadata.ipAddress || null,
        userAgent: metadata.userAgent || null,
        referrer: metadata.referrer || null,
        honeypotTriggered,
        formLoadedAt: data.formLoadedAt ? new Date(data.formLoadedAt) : null,
      })
      .returning();

    // Send notification email for non-spam enquiries
    if (!isSpam) {
      await this.sendAdminNotification(newRecord as EnquiryResponseDTO);
    }

    return {
      enquiry: newRecord as EnquiryResponseDTO,
      isSpam,
      reason: spamReason,
    };
  }

  /**
   * Update enquiry status
   */
  async updateStatus(
    id: number,
    status: EnquiryStatus,
    userId?: number,
  ): Promise<EnquiryResponseDTO | null> {
    const updates: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };

    // Set timestamp and user for specific statuses
    if (status === ENQUIRY_STATUS.READ) {
      updates.readAt = new Date();
      if (userId) updates.readBy = userId;
    } else if (status === ENQUIRY_STATUS.REPLIED) {
      updates.repliedAt = new Date();
      if (userId) updates.repliedBy = userId;
    }

    const result = await db
      .update(enquiries)
      .set(updates)
      .where(eq(enquiries.id, id))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return result[0] as EnquiryResponseDTO;
  }

  /**
   * Update admin notes
   */
  async updateNotes(
    id: number,
    adminNotes: string | null,
  ): Promise<EnquiryResponseDTO | null> {
    const result = await db
      .update(enquiries)
      .set({
        adminNotes,
        updatedAt: new Date(),
      })
      .where(eq(enquiries.id, id))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return result[0] as EnquiryResponseDTO;
  }

  /**
   * Full update (for admin panel)
   */
  override async update(
    id: number,
    data: UpdateEnquiryDTO,
  ): Promise<EnquiryResponseDTO | null> {
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.status !== undefined) {
      updates.status = data.status;
    }
    if (data.adminNotes !== undefined) {
      updates.adminNotes = data.adminNotes;
    }

    const result = await db
      .update(enquiries)
      .set(updates)
      .where(eq(enquiries.id, id))
      .returning();

    if (result.length === 0) {
      return null;
    }

    return result[0] as EnquiryResponseDTO;
  }

  /**
   * Delete enquiry
   */
  override async delete(id: number): Promise<boolean> {
    const result = await db
      .delete(enquiries)
      .where(eq(enquiries.id, id))
      .returning();

    return result.length > 0;
  }

  /**
   * Bulk mark as spam
   */
  async bulkMarkAsSpam(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;

    let count = 0;
    for (const id of ids) {
      const result = await this.updateStatus(id, ENQUIRY_STATUS.SPAM);
      if (result) count++;
    }

    return count;
  }

  /**
   * Bulk delete
   */
  async bulkDelete(ids: number[]): Promise<number> {
    if (ids.length === 0) return 0;

    let count = 0;
    for (const id of ids) {
      const deleted = await this.delete(id);
      if (deleted) count++;
    }

    return count;
  }

  /**
   * Send admin notification email
   * Uses email configuration from site settings
   */
  private async sendAdminNotification(
    enquiry: EnquiryResponseDTO,
  ): Promise<void> {
    try {
      // Get email settings from site_settings
      const emailSettings = await SiteSettingService.getByKey("email_settings");

      if (!emailSettings?.value || typeof emailSettings.value !== "object") {
        console.log(
          "[Enquiry] Email settings not configured, skipping notification",
        );
        return;
      }

      const settings = emailSettings.value as Record<string, unknown>;
      const adminEmail = settings.adminEmail as string | undefined;

      if (!adminEmail) {
        console.log(
          "[Enquiry] Admin email not configured, skipping notification",
        );
        return;
      }

      // TODO: Implement actual email sending when Email Service (Issue #10) is ready
      // For now, just log the notification
      console.log(
        `[Enquiry] New enquiry notification would be sent to: ${adminEmail}`,
      );
      console.log(
        `[Enquiry] From: ${enquiry.name || "Anonymous"} <${
          enquiry.email || enquiry.phone
        }>`,
      );
      console.log(`[Enquiry] Subject: ${enquiry.subject || "No subject"}`);
      console.log(`[Enquiry] Message: ${enquiry.message.substring(0, 100)}...`);

      // When Email Service is ready, replace the above with:
      // await EmailService.send({
      //   to: adminEmail,
      //   subject: `New Contact Form Submission: ${enquiry.subject || 'No subject'}`,
      //   template: 'enquiry-notification',
      //   data: enquiry,
      // });
    } catch (error) {
      // Don't fail the submission if email notification fails
      console.error("[Enquiry] Failed to send admin notification:", error);
    }
  }
}

// Export singleton instance
export const enquiryService = new EnquiryService();
