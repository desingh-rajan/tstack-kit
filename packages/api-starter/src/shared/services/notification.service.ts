/**
 * Notification Service
 *
 * Centralized service for sending notifications (email, eventually SMS/push).
 * Uses lazy initialization and fire-and-forget pattern for non-blocking notifications.
 *
 * @example
 * ```typescript
 * import { notificationService } from "@/shared/services/notification.service.ts";
 *
 * // Send welcome email (fire-and-forget - doesn't block)
 * notificationService.sendWelcomeEmail("user@example.com", "John");
 *
 * // Send order shipped email
 * notificationService.sendOrderShippedEmail("user@example.com", {
 *   userName: "John",
 *   orderNumber: "ORD-123",
 *   trackingNumber: "1Z999AA...",
 *   trackingUrl: "https://track.example.com/1Z999AA",
 *   carrier: "UPS",
 *   shippingAddress: { ... },
 * });
 * ```
 */

import {
  createEmailProvider,
  createEmailServiceFromEnv,
  EmailService,
} from "../providers/email/index.ts";
import type {
  OrderCancelledEmailData,
  OrderConfirmationEmailData,
  OrderDeliveredEmailData,
  OrderProcessingEmailData,
  OrderShippedEmailData,
} from "../providers/email/templates/index.ts";

export class NotificationService {
  private emailService: EmailService | null = null;
  private initialized = false;

  constructor() {
    // Lazy initialization on first use to avoid env var race conditions
  }

  /**
   * Initialize email provider (lazy)
   */
  private initialize() {
    if (this.initialized) return;

    try {
      const provider = createEmailProvider();
      if (provider) {
        this.emailService = createEmailServiceFromEnv(provider);
        console.log(
          `[NotificationService] Initialized with ${provider.name} provider`,
        );
        this.initialized = true;
      }
    } catch (error) {
      console.error(
        "[NotificationService] Failed to initialize email provider:",
        error,
      );
    }
  }

  /**
   * Helper to ensure service is initialized and run notification safely
   * Fire-and-forget pattern: logs errors but doesn't throw
   */
  private async safeRun(
    name: string,
    fn: (service: EmailService) => Promise<unknown>,
  ): Promise<void> {
    if (!this.emailService) {
      this.initialize();
      if (!this.emailService) {
        if (!this.initialized) {
          console.warn(
            `[NotificationService] Skipping ${name}: No provider configured`,
          );
        }
        return;
      }
    }

    try {
      await fn(this.emailService);
      console.log(`[NotificationService] Sent ${name}`);
    } catch (error) {
      console.error(`[NotificationService] Failed to send ${name}:`, error);
      // Don't throw to prevent blocking main business logic
    }
  }

  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(to: string, userName: string): Promise<void> {
    await this.safeRun(
      "welcome email",
      (service) => service.sendWelcomeEmail(to, userName),
    );
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    to: string,
    userName: string,
    verificationUrl: string,
  ): Promise<void> {
    await this.safeRun(
      "verification email",
      (service) => service.sendVerificationEmail(to, userName, verificationUrl),
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    to: string,
    userName: string,
    resetUrl: string,
  ): Promise<void> {
    await this.safeRun(
      "password reset email",
      (service) => service.sendPasswordResetEmail(to, userName, resetUrl),
    );
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(
    to: string,
    data: Omit<
      OrderConfirmationEmailData,
      "appName" | "appUrl" | "storeUrl" | "supportEmail"
    >,
  ): Promise<void> {
    await this.safeRun(
      `order confirmation email (${data.orderNumber})`,
      (service) => service.sendOrderConfirmationEmail(to, data),
    );
  }

  /**
   * Send order processing email
   */
  async sendOrderProcessingEmail(
    to: string,
    data: Omit<
      OrderProcessingEmailData,
      "appName" | "appUrl" | "storeUrl" | "supportEmail"
    >,
  ): Promise<void> {
    await this.safeRun(
      `order processing email (${data.orderNumber})`,
      (service) => service.sendOrderProcessingEmail(to, data),
    );
  }

  /**
   * Send order shipped email
   */
  async sendOrderShippedEmail(
    to: string,
    data: Omit<
      OrderShippedEmailData,
      "appName" | "appUrl" | "storeUrl" | "supportEmail"
    >,
  ): Promise<void> {
    await this.safeRun(
      `order shipped email (${data.orderNumber})`,
      (service) => service.sendOrderShippedEmail(to, data),
    );
  }

  /**
   * Send order delivered email
   */
  async sendOrderDeliveredEmail(
    to: string,
    data: Omit<
      OrderDeliveredEmailData,
      "appName" | "appUrl" | "storeUrl" | "supportEmail"
    >,
  ): Promise<void> {
    await this.safeRun(
      `order delivered email (${data.orderNumber})`,
      (service) => service.sendOrderDeliveredEmail(to, data),
    );
  }

  /**
   * Send order cancelled email
   */
  async sendOrderCancelledEmail(
    to: string,
    data: Omit<
      OrderCancelledEmailData,
      "appName" | "appUrl" | "storeUrl" | "supportEmail"
    >,
  ): Promise<void> {
    await this.safeRun(
      `order cancelled email (${data.orderNumber})`,
      (service) => service.sendOrderCancelledEmail(to, data),
    );
  }
}

// Singleton instance for easy import
export const notificationService = new NotificationService();
